from typing import Any

from clinical_mdr_api.domain_repositories.biomedical_concepts.activity_item_class_repository import (
    ActivityItemClassRepository,
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
    ActivityItemClassCodelist,
    ActivityItemClassCreateInput,
    ActivityItemClassEditInput,
    ActivityItemClassMappingInput,
    ActivityItemClassVersion,
    CompactActivityItemClass,
)
from clinical_mdr_api.models.controlled_terminologies.ct_codelist import (
    CTCodelistNameAndAttributes,
)
from clinical_mdr_api.models.utils import (
    EmptyGenericFilteringResult,
    GenericFilteringReturn,
)
from clinical_mdr_api.repositories._utils import FilterOperator
from clinical_mdr_api.services.controlled_terminologies.ct_codelist import (
    CTCodelistService,
)
from clinical_mdr_api.services.neomodel_ext_generic import NeomodelExtGenericService
from common.exceptions import NotFoundException


class ActivityItemClassService(NeomodelExtGenericService[ActivityItemClassAR]):
    repository_interface = ActivityItemClassRepository
    api_model_class = ActivityItemClass
    version_class = ActivityItemClassVersion

    def _transform_aggregate_root_to_pydantic_model(
        self, item_ar: ActivityItemClassAR
    ) -> ActivityItemClass:
        return ActivityItemClass.from_activity_item_class_ar(
            activity_item_class_ar=item_ar,
            find_activity_instance_class_by_uid=self._repos.activity_instance_class_repository.find_by_uid_2,
        )

    def _create_aggregate_root(
        self, item_input: ActivityItemClassCreateInput, library: LibraryVO
    ) -> ActivityItemClassAR:
        return ActivityItemClassAR.from_input_values(
            author_id=self.author_id,
            activity_item_class_vo=ActivityItemClassVO.from_repository_values(
                name=item_input.name,
                definition=item_input.definition,
                nci_concept_id=item_input.nci_concept_id,
                order=item_input.order,
                activity_instance_classes=[
                    ActivityInstanceClassActivityItemClassRelVO(
                        uid=item.uid,
                        mandatory=item.mandatory,
                        is_adam_param_specific_enabled=item.is_adam_param_specific_enabled,
                    )
                    for item in item_input.activity_instance_classes
                ],
                role=CTTermItem(uid=item_input.role_uid, name=None, codelist_uid=None),
                data_type=CTTermItem(
                    uid=item_input.data_type_uid, name=None, codelist_uid=None
                ),
            ),
            library=library,
            generate_uid_callback=self.repository.generate_uid,
            activity_instance_class_exists=self._repos.activity_instance_class_repository.check_exists_final_version,
            activity_item_class_exists_by_name_callback=self._repos.activity_item_class_repository.check_exists_by_name,
            ct_term_exists=self._repos.ct_term_name_repository.term_exists,
        )

    def _edit_aggregate(
        self, item: ActivityItemClassAR, item_edit_input: ActivityItemClassEditInput
    ) -> ActivityItemClassAR:
        item.edit_draft(
            author_id=self.author_id,
            change_description=item_edit_input.change_description,
            activity_item_class_vo=ActivityItemClassVO.from_repository_values(
                name=item_edit_input.name or item.activity_item_class_vo.name,
                definition=item_edit_input.definition,
                nci_concept_id=item_edit_input.nci_concept_id,
                order=item_edit_input.order or item.activity_item_class_vo.order,
                activity_instance_classes=[
                    ActivityInstanceClassActivityItemClassRelVO(
                        uid=item.uid,
                        mandatory=item.mandatory,
                        is_adam_param_specific_enabled=item.is_adam_param_specific_enabled,
                    )
                    for item in item_edit_input.activity_instance_classes
                ],
                role=(
                    CTTermItem(
                        uid=item_edit_input.role_uid, name=None, codelist_uid=None
                    )
                    if item_edit_input.role_uid
                    else item.activity_item_class_vo.role
                ),
                data_type=(
                    CTTermItem(
                        uid=item_edit_input.data_type_uid, name=None, codelist_uid=None
                    )
                    if item_edit_input.data_type_uid
                    else item.activity_item_class_vo.data_type
                ),
            ),
            activity_instance_class_exists=self._repos.activity_instance_class_repository.check_exists_final_version,
            activity_item_class_exists_by_name_callback=self._repos.activity_item_class_repository.check_exists_by_name,
            ct_term_exists=self._repos.ct_term_name_repository.term_exists,
        )
        return item

    def patch_mappings(
        self, uid: str, mapping_input: ActivityItemClassMappingInput
    ) -> ActivityItemClass:
        activity_item_class = self._repos.activity_item_class_repository.find_by_uid(
            uid
        )

        NotFoundException.raise_if_not(activity_item_class, "Activity Item Class", uid)

        try:
            self._repos.activity_item_class_repository.patch_mappings(
                uid, mapping_input.variable_class_uids
            )
        finally:
            self._repos.activity_item_class_repository.close()

        return self.get_by_uid(uid)

    def get_codelists_of_activity_item_class(
        self,
        activity_item_class_uid: str,
        dataset_uid: str,
        use_sponsor_model: bool = True,
        sort_by: dict[str, bool] | None = None,
        page_number: int = 1,
        page_size: int = 0,
        filter_by: dict[str, dict[str, Any]] | None = None,
        filter_operator: FilterOperator = FilterOperator.AND,
        total_count: bool = False,
    ) -> GenericFilteringReturn[ActivityItemClassCodelist]:

        codelists_and_terms = self._repos.activity_item_class_repository.get_referenced_codelist_and_term_uids(
            activity_item_class_uid, dataset_uid, use_sponsor_model
        )

        if not codelists_and_terms:
            return EmptyGenericFilteringResult
        codelist_uids = codelists_and_terms.keys()

        if filter_by is None:
            filter_by = {}
        filter_by["codelist_uid"] = {"v": codelist_uids, "op": "eq"}

        (
            all_aggregated_terms,
            count,
        ) = CTCodelistService()._repos.ct_codelist_aggregated_repository.find_all_aggregated_result(
            total_count=total_count,
            sort_by=sort_by,
            filter_by=filter_by,
            filter_operator=filter_operator,
            page_number=page_number,
            page_size=page_size,
        )
        items = [
            ActivityItemClassCodelist.from_codelist_and_terms(
                CTCodelistNameAndAttributes.from_ct_codelist_ar(
                    name,
                    attrs,
                    paired_codes_codelist_uid=paired.paired_codes_codelist_uid,
                    paired_names_codelist_uid=paired.paired_names_codelist_uid,
                ),
                codelists_and_terms[attrs.uid],
            )
            for name, attrs, paired in all_aggregated_terms
        ]

        return GenericFilteringReturn.create(items, count)

    def get_all_for_activity_instance_class(
        self, activity_item_class_uid: str
    ) -> list[CompactActivityItemClass]:
        item_classes = self.repository.get_all_for_activity_instance_class(
            activity_item_class_uid
        )
        return [
            CompactActivityItemClass.model_validate(item_class)
            for item_class in item_classes
        ]
