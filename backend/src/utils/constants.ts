import * as path from 'path';
import './dotenv';
import { DashboardConfig, KnownLabels, NotebookSize } from '../types';

export const PORT = Number(process.env.PORT) || Number(process.env.BACKEND_PORT) || 8080;
export const IP = process.env.IP || '0.0.0.0';
export const LOG_LEVEL = process.env.FASTIFY_LOG_LEVEL || process.env.LOG_LEVEL || 'info';
export const LOG_DIR = path.join(__dirname, '../../../logs');
export const DEV_MODE = process.env.APP_ENV === 'development';
/** Allows a username to be impersonated in place of the logged in user for testing purposes -- impacts only some API */
export const DEV_IMPERSONATE_USER = DEV_MODE ? process.env.DEV_IMPERSONATE_USER : undefined;
export const DEV_IMPERSONATE_PASSWORD = DEV_MODE ? process.env.DEV_IMPERSONATE_PASSWORD : undefined;
export const APP_ENV = process.env.APP_ENV;
export const GENAI_MODE = process.env.GENAI_MODE === 'true';

export const USER_ACCESS_TOKEN = 'x-forwarded-access-token';

export const yamlRegExp = /\.ya?ml$/;
export const mdRegExp = /\.md$/;

export const IMAGE_ANNOTATIONS = {
  DESC: 'opendatahub.io/notebook-image-desc',
  DISP_NAME: 'opendatahub.io/notebook-image-name',
  URL: 'opendatahub.io/notebook-image-url',
  DEFAULT: 'opendatahub.io/default-image',
  SOFTWARE: 'opendatahub.io/notebook-software',
  DEPENDENCIES: 'opendatahub.io/notebook-python-dependencies',
  IMAGE_ORDER: 'opendatahub.io/notebook-image-order',
  RECOMMENDED: 'opendatahub.io/workbench-image-recommended',
  OUTDATED: 'opendatahub.io/image-tag-outdated',
};
export const blankDashboardCR: DashboardConfig = {
  apiVersion: 'opendatahub.io/v1alpha',
  kind: 'OdhDashboardConfig',
  metadata: {
    name: 'odh-dashboard-config',
    labels: {
      'opendatahub.io/dashboard': 'true',
    },
  },
  spec: {
    dashboardConfig: {
      enablement: true,
      disableInfo: false,
      disableSupport: false,
      disableClusterManager: false,
      disableTracking: true,
      disableBYONImageStream: false,
      disableISVBadges: false,
      disableAppLauncher: false,
      disableUserManagement: false,
      disableHome: false,
      disableProjects: false,
      disableModelServing: false,
      disableProjectSharing: false,
      disableCustomServingRuntimes: false,
      disableBiasMetrics: false,
      disablePerformanceMetrics: false,
      disablePipelines: false,
      disableKServe: false,
      disableKServeAuth: false,
      disableKServeMetrics: false,
      disableModelMesh: false,
      disableAcceleratorProfiles: false,
      disablePipelineExperiments: false,
      disableDistributedWorkloads: false,
      disableModelRegistry: true,
      disableConnectionTypes: true,
    },
    notebookController: {
      enabled: true,
    },
    groupsConfig: {
      adminGroups: 'odh-admins',
      allowedGroups: 'system:authenticated',
    },
    templateOrder: [],
    // templateDisablement: [], Don't create this field, will be used in migration
  },
};

export const MOUNT_PATH = '/opt/app-root/src';
export const DEFAULT_PVC_SIZE = '20Gi';

export const DEFAULT_NOTEBOOK_SIZES: NotebookSize[] = [
  {
    name: 'Small',
    resources: {
      requests: {
        cpu: '1',
        memory: '8Gi',
      },
      limits: {
        cpu: '2',
        memory: '8Gi',
      },
    },
  },
  {
    name: 'Medium',
    resources: {
      requests: {
        cpu: '3',
        memory: '24Gi',
      },
      limits: {
        cpu: '6',
        memory: '24Gi',
      },
    },
  },
  {
    name: 'Large',
    resources: {
      requests: {
        cpu: '7',
        memory: '56Gi',
      },
      limits: {
        cpu: '14',
        memory: '56Gi',
      },
    },
  },
  {
    name: 'X Large',
    resources: {
      requests: {
        cpu: '15',
        memory: '120Gi',
      },
      limits: {
        cpu: '30',
        memory: '120Gi',
      },
    },
  },
];

export const imageUrlRegex =
  /^([\w.\-_]+((?::\d+|)(?=\/[a-z0-9._-]+\/[a-z0-9._-]+))|)(?:\/|)([a-z0-9.\-_]+(?:\/[a-z0-9.\-_]+|))(?::([\w.\-_]{1,127})|)/;

export const THANOS_RBAC_PORT = '9092';
export const THANOS_INSTANCE_NAME = 'thanos-querier';
export const THANOS_NAMESPACE = 'openshift-monitoring';
export const LABEL_SELECTOR_DASHBOARD_RESOURCE = `${KnownLabels.DASHBOARD_RESOURCE}=true`;

export const MODEL_REGISTRY_NAMESPACE = 'odh-model-registries';

export const MAAS_API_URL = process.env.MAAS_API_URL;
export const MAAS_API_KEY = process.env.MAAS_API_KEY;
export const MAAS_GRANITE_PLAN_ID = process.env.MAAS_GRANITE_PLAN_ID;
export const MAAS_SDXL_PLAN_ID = process.env.MAAS_SDXL_PLAN_ID;
export const MAAS_DOCLING_PLAN_ID = process.env.MAAS_DOCLING_PLAN_ID;
export const MAAS_GUARD_PLAN_ID = process.env.MAAS_GUARD_PLAN_ID;
export const MAAS_SAFETY_PLAN_ID = process.env.MAAS_SAFETY_PLAN_ID;
