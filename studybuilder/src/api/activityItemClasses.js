import baseCollection from './baseCollection'
import repository from './repository'

const resource = 'activity-item-classes'
const api = baseCollection(resource)

export default {
  ...api,

  getDatasetCodelists(activityItemClassUid, datasetUid, params) {
    return repository.get(
      `${resource}/${activityItemClassUid}/datasets/${datasetUid}/codelists`,
      {
        params,
      }
    )
  },
}
