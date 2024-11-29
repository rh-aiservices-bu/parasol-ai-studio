export enum ProjectSectionID {
  OVERVIEW = 'overview',
  WORKBENCHES = 'workbenches',
  WORKBENCHES_EASY = 'applications',
  CLUSTER_STORAGES = 'cluster-storages',
  DATA_CONNECTIONS = 'data-connections',
  MODEL_SERVER = 'model-server',
  PIPELINES = 'pipelines-projects',
  PERMISSIONS = 'permissions',
  SETTINGS = 'settings',
}

export type ProjectSectionTitlesType = {
  [key in ProjectSectionID]: string;
};
