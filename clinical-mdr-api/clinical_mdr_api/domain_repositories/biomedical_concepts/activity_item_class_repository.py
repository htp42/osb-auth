import json

from neomodel import NodeSet, db
from neomodel.sync_.match import (
    Collect,
    Last,
    NodeNameResolver,
    Optional,
    Path,
    RawCypher,
    RelationNameResolver,
)

from clinical_mdr_api.domain_repositories.controlled_terminologies.ct_codelist_attributes_repository import (
    CTCodelistAttributesRepository,
)
from clinical_mdr_api.domain_repositories.library_item_repository import (
    LibraryItemRepositoryImplBase,
    _AggregateRootType,
)
from clinical_mdr_api.domain_repositories.models.biomedical_concepts import (
    ActivityInstanceClassRoot,
    ActivityItemClassRoot,
    ActivityItemClassValue,
)
from clinical_mdr_api.domain_repositories.models.controlled_terminology import (
    CTTermRoot,
)
from clinical_mdr_api.domain_repositories.models.generic import (
    Library,
    VersionRelationship,
)
from clinical_mdr_api.domain_repositories.models.standard_data_model import (
    VariableClass,
)
from clinical_mdr_api.domain_repositories.neomodel_ext_item_repository import (
    NeomodelExtBaseRepository,
)
from clinical_mdr_api.domains.biomedical_concepts.activity_item_class import (
    ActivityInstanceClassActivityItemClassRelVO,
    ActivityItemClassAR,
    ActivityItemClassVO,
    CTTermItem,
)
from clinical_mdr_api.domains.versioned_object_aggregate import LibraryVO
from clinical_mdr_api.models.biomedical_concepts.activity_item_class import (
    ActivityItemClass,
)
from common.config import settings


class ActivityItemClassRepository(  # type: ignore[misc]
    NeomodelExtBaseRepository, LibraryItemRepositoryImplBase[_AggregateRootType]
):
    root_class = ActivityItemClassRoot
    value_class = ActivityItemClassValue
    return_model = ActivityItemClass

    def get_neomodel_extension_query(self) -> NodeSet:
        return (
            ActivityItemClassRoot.nodes.fetch_relations(
                "has_latest_value",
                "has_library",
                "has_latest_value__has_role__has_selected_term__has_name_root__has_latest_value",
                "has_latest_value__has_role__has_selected_codelist",
                "has_latest_value__has_data_type__has_selected_term__has_name_root__has_latest_value",
                "has_latest_value__has_data_type__has_selected_codelist",
                Optional("has_activity_instance_class"),
                Optional("has_activity_instance_class__has_latest_value"),
                Optional("maps_variable_class"),
            )
            .unique_variables("has_latest_value", "has_activity_instance_class")
            .subquery(
                ActivityItemClassRoot.nodes.fetch_relations("has_version")
                .intermediate_transform(
                    {"rel": {"source": RelationNameResolver("has_version")}},
                    ordering=[
                        RawCypher("toInteger(split(rel.version, '.')[0])"),
                        RawCypher("toInteger(split(rel.version, '.')[1])"),
                        "rel.end_date",
                        "rel.start_date",
                    ],
                )
                .annotate(latest_version=Last(Collect("rel"))),
                ["latest_version"],
                initial_context=[NodeNameResolver("self")],
            )
            .annotate(
                Collect(NodeNameResolver("has_activity_instance_class"), distinct=True),
                Collect(
                    RelationNameResolver("has_activity_instance_class"), distinct=True
                ),
                Collect(
                    NodeNameResolver("has_activity_instance_class__has_latest_value"),
                    distinct=True,
                ),
                Collect(
                    RelationNameResolver(
                        "has_activity_instance_class__has_latest_value"
                    ),
                    distinct=True,
                ),
                Collect(NodeNameResolver("maps_variable_class"), distinct=True),
                Collect(RelationNameResolver("maps_variable_class"), distinct=True),
            )
        )

    def get_all_for_activity_instance_class(
        self, activity_instance_class_uid: str
    ) -> set[ActivityItemClassRoot]:
        """
        Return all Activity Item Class nodes linked to given Activity Instance Class
        and its parents.
        """
        nodes = (
            ActivityItemClassRoot.nodes.traverse(
                Path("has_latest_value", include_rels_in_return=False)
            )
            .filter(has_activity_instance_class__uid=activity_instance_class_uid)
            .resolve_subgraph()
        )

        # Then fetch parent UIDs
        query = """MATCH (n:ActivityInstanceClassRoot)
WHERE n.uid=$uid
OPTIONAL MATCH (n)-[:PARENT_CLASS]->{1,3}(m:ActivityInstanceClassRoot)
RETURN collect(DISTINCT m.uid)
        """
        results, _ = db.cypher_query(query, {"uid": activity_instance_class_uid})
        parent_uids = []
        if results and results[0][0]:
            parent_uids += results[0][0]

        # Finally, get activity item classes linked to parents
        parent_nodes = (
            ActivityItemClassRoot.nodes.traverse(
                Path("has_latest_value", include_rels_in_return=False)
            )
            .exclude(uid__in=[node.uid for node in nodes])
            .filter(has_activity_instance_class__uid__in=parent_uids)
            .resolve_subgraph()
        )
        return set(nodes).union(set(parent_nodes))

    def _has_data_changed(
        self, ar: ActivityItemClassAR, value: ActivityItemClassValue
    ) -> bool:
        existing_activity_instance_classes = []
        root = value.has_version.single()
        for node in root.has_activity_instance_class.all():
            rel = root.has_activity_instance_class.relationship(node)
            existing_activity_instance_classes.append(
                {
                    "uid": node.uid,
                    "mandatory": rel.mandatory,
                    "is_adam_param_specific_enabled": rel.is_adam_param_specific_enabled,
                }
            )
        existing_activity_instance_classes.sort(key=json.dumps)

        new_activity_instance_classes = sorted(
            [
                item.__dict__
                for item in ar.activity_item_class_vo.activity_instance_classes
            ],
            key=json.dumps,
        )

        if _role := value.has_role.single():
            _role = (
                _role.has_selected_term.single().uid,
                _role.has_selected_codelist.single().uid,
            )
        else:
            _role = (None, None)

        if _data_type := value.has_data_type.single():
            _data_type = (
                _data_type.has_selected_term.single().uid,
                _data_type.has_selected_codelist.single().uid,
            )
        else:
            _data_type = (None, None)

        return (
            ar.activity_item_class_vo.name != value.name
            or ar.activity_item_class_vo.definition != value.definition
            or ar.activity_item_class_vo.nci_concept_id != value.nci_concept_id
            or ar.activity_item_class_vo.order != value.order
            or new_activity_instance_classes != existing_activity_instance_classes
            or (
                ar.activity_item_class_vo.role.uid,
                ar.activity_item_class_vo.role.codelist_uid,
            )
            != _role
            or (
                ar.activity_item_class_vo.data_type.uid,
                ar.activity_item_class_vo.data_type.codelist_uid,
            )
            != _data_type
        )

    def _get_or_create_value(
        self, root: ActivityItemClassRoot, ar: ActivityItemClassAR
    ) -> ActivityItemClassValue:
        for itm in root.has_version.all():
            if not self._has_data_changed(ar, itm):
                return itm
        new_value = ActivityItemClassValue(
            name=ar.activity_item_class_vo.name,
            order=ar.activity_item_class_vo.order,
            definition=ar.activity_item_class_vo.definition,
            nci_concept_id=ar.activity_item_class_vo.nci_concept_id,
        )
        self._db_save_node(new_value)
        for (
            activity_instance_class_uid
        ) in ar.activity_item_class_vo.activity_instance_classes:
            activity_instance_class = ActivityInstanceClassRoot.nodes.get_or_none(
                uid=activity_instance_class_uid.uid
            )
            rel = root.has_activity_instance_class.relationship(activity_instance_class)
            if rel:
                rel.mandatory = activity_instance_class_uid.mandatory
                rel.is_adam_param_specific_enabled = (
                    activity_instance_class_uid.is_adam_param_specific_enabled
                )
                rel.save()
            else:
                root.has_activity_instance_class.connect(
                    activity_instance_class,
                    {
                        "mandatory": activity_instance_class_uid.mandatory,
                        "is_adam_param_specific_enabled": activity_instance_class_uid.is_adam_param_specific_enabled,
                    },
                )

        data_type = CTTermRoot.nodes.get(uid=ar.activity_item_class_vo.data_type.uid)
        selected_term_node = (
            CTCodelistAttributesRepository().get_or_create_selected_term(
                data_type,
                codelist_submission_value=settings.stdm_odm_data_type_cl_submval,
            )
        )
        new_value.has_data_type.connect(selected_term_node)

        role = CTTermRoot.nodes.get(uid=ar.activity_item_class_vo.role.uid)
        selected_term_node = (
            CTCodelistAttributesRepository().get_or_create_selected_term(
                role, codelist_submission_value=settings.stdm_role_cl_submval
            )
        )
        new_value.has_role.connect(selected_term_node)

        return new_value

    def generate_uid(self) -> str:
        return ActivityItemClassRoot.get_next_free_uid_and_increment_counter()

    def _create_aggregate_root_instance_from_version_root_relationship_and_value(
        self,
        root: ActivityItemClassRoot,
        library: Library,
        relationship: VersionRelationship,
        value: ActivityItemClassValue,
        **_kwargs,
    ) -> ActivityItemClassAR:
        activity_instance_classes = root.has_activity_instance_class.all()

        role_term_context = value.has_role.get()
        term_root = role_term_context.has_selected_term.single()
        role = CTTermItem(
            uid=term_root.uid,
            name=term_root.has_name_root.single().has_version.single().name,
            codelist_uid=role_term_context.has_selected_codelist.single().uid,
        )

        data_type_term_context = value.has_data_type.get()
        term_root = data_type_term_context.has_selected_term.single()
        data_type = CTTermItem(
            uid=term_root.uid,
            name=term_root.has_name_root.single().has_version.single().name,
            codelist_uid=data_type_term_context.has_selected_codelist.single().uid,
        )

        variable_class_uids = [node.uid for node in root.maps_variable_class.all()]
        return ActivityItemClassAR.from_repository_values(
            uid=root.uid,
            activity_item_class_vo=ActivityItemClassVO.from_repository_values(
                name=value.name,
                definition=value.definition,
                nci_concept_id=value.nci_concept_id,
                order=value.order,
                activity_instance_classes=[
                    ActivityInstanceClassActivityItemClassRelVO(
                        uid=activity_instance_class.uid,
                        mandatory=activity_instance_class.has_activity_item_class.relationship(
                            root
                        ).mandatory,
                        is_adam_param_specific_enabled=activity_instance_class.has_activity_item_class.relationship(
                            root
                        ).is_adam_param_specific_enabled,
                    )
                    for activity_instance_class in activity_instance_classes
                ],
                role=role,
                data_type=data_type,
                variable_class_uids=variable_class_uids,
            ),
            library=LibraryVO.from_input_values_2(
                library_name=library.name,
                is_library_editable_callback=lambda _: library.is_editable,
            ),
            item_metadata=self._library_item_metadata_vo_from_relation(relationship),
        )

    def patch_mappings(self, uid: str, variable_class_uids: list[str]) -> None:
        root = ActivityItemClassRoot.nodes.get(uid=uid)
        root.maps_variable_class.disconnect_all()
        for variable_class in variable_class_uids:
            variable_class = VariableClass.nodes.get(uid=variable_class)
            root.maps_variable_class.connect(variable_class)

    def _maintain_parameters(
        self,
        versioned_object: _AggregateRootType,
        root: ActivityItemClassRoot,
        value: ActivityItemClassValue,
    ) -> None:
        # This method from parent repo is not needed for this repo
        # So we use pass to skip implementation
        pass

    def get_referenced_codelist_and_term_uids(
        self, activity_item_class_uid: str, dataset_uid: str, use_sponsor_model: bool
    ) -> dict[str, list[str] | None]:

        uids_for_standard_model = (
            ActivityItemClassRoot.nodes.filter(
                uid=activity_item_class_uid,
                maps_variable_class__has_instance__implemented_by_variable__has_dataset_variable__is_instance_of__uid=dataset_uid,
            )
            .traverse(
                "maps_variable_class__has_instance__implemented_by_variable__references_codelist",
                Path(
                    value="maps_variable_class__has_instance__implemented_by_variable__references_term__has_selected_term",
                    optional=True,
                    include_rels_in_return=False,
                ),
            )
            .unique_variables(
                "maps_variable_class__has_instance__implemented_by_variable"
            )
            .intermediate_transform(
                {
                    "codelist_uid": {
                        "source": NodeNameResolver(
                            "maps_variable_class__has_instance__implemented_by_variable__references_codelist"
                        ),
                        "source_prop": "uid",
                        "include_in_return": True,
                    },
                    "term_uid": {
                        "source": NodeNameResolver(
                            "maps_variable_class__has_instance__implemented_by_variable__references_term__has_selected_term"
                        ),
                        "source_prop": "uid",
                        "include_in_return": True,
                    },
                },
                distinct=True,
            )
            .all()
        )

        codelist_term_sets: dict[str, set[str] | None] = {}
        for cl_uid, term_uid in uids_for_standard_model:
            if cl_uid not in codelist_term_sets:
                if term_uid is None:
                    codelist_term_sets[cl_uid] = None
                else:
                    codelist_term_sets[cl_uid] = {term_uid}
            elif term_uid is not None:
                if codelist_term_sets[cl_uid] is None:
                    codelist_term_sets[cl_uid] = set()
                codelist_term_sets[cl_uid].add(term_uid)

        if use_sponsor_model:
            uids_for_sponsor_model = (
                ActivityItemClassRoot.nodes.filter(
                    uid=activity_item_class_uid,
                    maps_variable_class__has_instance__implemented_by_sponsor_variable__has_variable__is_instance_of__uid=dataset_uid,
                )
                .traverse(
                    "maps_variable_class__has_instance__implemented_by_sponsor_variable__references_codelist",
                    Path(
                        value="maps_variable_class__has_instance__implemented_by_sponsor_variable__references_term__has_selected_term",
                        optional=True,
                        include_rels_in_return=False,
                    ),
                )
                .unique_variables(
                    "maps_variable_class__has_instance__implemented_by_sponsor_variable"
                )
                .intermediate_transform(
                    {
                        "codelist_uid": {
                            "source": NodeNameResolver(
                                "maps_variable_class__has_instance__implemented_by_sponsor_variable__references_codelist"
                            ),
                            "source_prop": "uid",
                            "include_in_return": True,
                        },
                        "term_uid": {
                            "source": NodeNameResolver(
                                "maps_variable_class__has_instance__implemented_by_sponsor_variable__references_term__has_selected_term"
                            ),
                            "source_prop": "uid",
                            "include_in_return": True,
                        },
                    },
                    distinct=True,
                )
                .all()
            )
            for cl_uid, term_uid in uids_for_sponsor_model:
                if cl_uid not in codelist_term_sets:
                    if term_uid is None:
                        codelist_term_sets[cl_uid] = None
                    else:
                        codelist_term_sets[cl_uid] = {term_uid}
                elif term_uid is not None:
                    if codelist_term_sets[cl_uid] is None:
                        codelist_term_sets[cl_uid] = set()
                    codelist_term_sets[cl_uid].add(term_uid)

        # Convert the sets to lists before returning
        codelists_and_terms: dict[str, list[str] | None] = {}
        for cl_uid, term_uids in codelist_term_sets.items():
            if isinstance(term_uids, set):
                codelists_and_terms[cl_uid] = list(term_uids)
            else:
                codelists_and_terms[cl_uid] = term_uids
        return codelists_and_terms
