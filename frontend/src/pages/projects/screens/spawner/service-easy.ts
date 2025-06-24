import { K8sStatus } from '@openshift/dynamic-plugin-sdk-utils';
import * as _ from 'lodash-es';
import {
  assembleConfigMap,
  assembleSecret,
  createConfigMap,
  createPvc,
  createSecret,
  deleteConfigMap,
  deleteSecret,
  replaceConfigMap,
  replaceSecret,
} from '~/api';
import { ConfigMapKind, NotebookKind, SecretKind } from '~/k8sTypes';
import { ROOT_MOUNT_PATH } from '~/pages/projects/pvc/const';
import {
  ConfigMapCategory,
  DataConnection,
  DataConnectionData,
  EnvironmentFromVariable,
  EnvironmentVariableType,
  EnvVariable,
  SecretCategory,
  StorageData,
  StorageType,
} from '~/pages/projects/types';
import { Volume, VolumeMount } from '~/types';
// eslint-disable-next-line no-restricted-imports
import { proxyCREATE, proxyGET } from '~/api/proxyUtils';
import { DEV_MODE } from '~/utilities/const';
import { fetchNotebookEnvVariables } from './environmentVariables/useNotebookEnvVariables';
import { getVolumesByStorageData } from './spawnerUtils';

const modelImageMap: { [key: string]: string } = {
  'custom-custom-cai-anything': 'anythingllm',
  'custom-custom-cai-sdxl': 'sdxl',
  'custom-custom-cai-code': 'code',
  'custom-custom-cai-docling': 'docling',
};

interface MaasResponse {
  message: string;
}

interface VectorDBConfiguration {
  VECTOR_DB: string,
  WEAVIATE_ENDPOINT?: string
}

export const createPvcDataForNotebook = async (
  projectName: string,
  storageData: StorageData,
  storageClassName?: string,
): Promise<{ volumes: Volume[]; volumeMounts: VolumeMount[] }> => {
  const { storageType } = storageData;

  const { volumes, volumeMounts } = getVolumesByStorageData(storageData);

  if (storageType === StorageType.NEW_PVC) {
    const pvc = await createPvc(storageData.creating, projectName, storageClassName);
    const newPvcName = pvc.metadata.name;
    volumes.push({ name: newPvcName, persistentVolumeClaim: { claimName: newPvcName } });
    volumeMounts.push({ mountPath: ROOT_MOUNT_PATH, name: newPvcName });
  }
  return { volumes, volumeMounts };
};

export const replaceRootVolumesForNotebook = async (
  projectName: string,
  notebook: NotebookKind,
  storageData: StorageData,
  storageClassName?: string,
  dryRun?: boolean,
): Promise<{ volumes: Volume[]; volumeMounts: VolumeMount[] }> => {
  const {
    storageType,
    existing: { storage: existingName },
  } = storageData;

  const oldVolumes = notebook.spec.template.spec.volumes || [];
  const oldVolumeMounts = notebook.spec.template.spec.containers[0].volumeMounts || [];

  let replacedVolume: Volume;
  let replacedVolumeMount: VolumeMount;

  if (storageType === StorageType.EXISTING_PVC) {
    replacedVolume = {
      name: existingName,
      persistentVolumeClaim: { claimName: existingName },
    };
    replacedVolumeMount = { name: existingName, mountPath: ROOT_MOUNT_PATH };
  } else {
    const pvc = await createPvc(storageData.creating, projectName, storageClassName, { dryRun });
    const newPvcName = pvc.metadata.name;
    replacedVolume = { name: newPvcName, persistentVolumeClaim: { claimName: newPvcName } };
    replacedVolumeMount = { mountPath: ROOT_MOUNT_PATH, name: newPvcName };
  }

  const rootVolumeMount = oldVolumeMounts.find(
    (volumeMount) => volumeMount.mountPath === ROOT_MOUNT_PATH,
  );

  // if no root, add the replaced one as the root
  if (!rootVolumeMount) {
    return {
      volumes: [...oldVolumes, replacedVolume],
      volumeMounts: [...oldVolumeMounts, replacedVolumeMount],
    };
  }

  const volumes = oldVolumes.map((volume) =>
    volume.name === rootVolumeMount.name ? replacedVolume : volume,
  );
  const volumeMounts = oldVolumeMounts.map((volumeMount) =>
    volumeMount.name === rootVolumeMount.name ? replacedVolumeMount : volumeMount,
  );

  return { volumes, volumeMounts };
};

const getPromisesForConfigMapsAndSecrets = (
  projectName: string,
  envVariables: EnvVariable[],
  type: 'create' | 'update',
  dryRun = false,
): Promise<SecretKind | ConfigMapKind>[] =>
  envVariables
    .map<Promise<SecretKind | ConfigMapKind> | null>((envVar) => {
      if (!envVar.values) {
        return null;
      }

      const dataAsRecord = envVar.values.data.reduce<Record<string, string>>(
        (acc, { key, value }) => ({ ...acc, [key]: value }),
        {},
      );

      switch (envVar.values.category) {
        case SecretCategory.GENERIC:
        case SecretCategory.UPLOAD:
          return type === 'create'
            ? createSecret(assembleSecret(projectName, dataAsRecord), { dryRun })
            : replaceSecret(
                assembleSecret(projectName, dataAsRecord, 'generic', envVar.existingName),
                { dryRun },
              );
        case SecretCategory.AWS:
          return type === 'create'
            ? createSecret(assembleSecret(projectName, dataAsRecord, 'aws'), { dryRun })
            : replaceSecret(assembleSecret(projectName, dataAsRecord, 'aws', envVar.existingName), {
                dryRun,
              });
        case ConfigMapCategory.GENERIC:
        case ConfigMapCategory.UPLOAD:
          return type === 'create'
            ? createConfigMap(assembleConfigMap(projectName, dataAsRecord), { dryRun })
            : replaceConfigMap(assembleConfigMap(projectName, dataAsRecord, envVar.existingName), {
                dryRun,
              });
        default:
          return null;
      }
    })
    .filter((v): v is Promise<SecretKind | ConfigMapKind> => !!v);

const getEnvFromList = (
  resources: (ConfigMapKind | SecretKind)[],
  initialList: EnvironmentFromVariable[],
): EnvironmentFromVariable[] =>
  resources.reduce<EnvironmentFromVariable[]>((acc, resource) => {
    let envFrom;
    if (resource.kind === 'Secret') {
      envFrom = {
        secretRef: {
          name: resource.metadata.name,
        },
      };
    } else if (resource.kind === 'ConfigMap') {
      envFrom = {
        configMapRef: {
          name: resource.metadata.name,
        },
      };
    } else {
      return acc;
    }
    return [...acc, envFrom];
  }, initialList);

export const createConfigMapsAndSecretsForNotebook = async (
  projectName: string,
  envVariables: EnvVariable[],
): Promise<EnvironmentFromVariable[]> => {
  const creatingPromises = getPromisesForConfigMapsAndSecrets(projectName, envVariables, 'create');

  return Promise.all(creatingPromises)
    .then((results: (ConfigMapKind | SecretKind)[]) => getEnvFromList(results, []))
    .catch((e) => {
      /* eslint-disable-next-line no-console */
      console.error('Creating environment variables failed: ', e);
      throw e;
    });
};

export const updateConfigMapsAndSecretsForNotebook = async (
  projectName: string,
  notebook: NotebookKind,
  envVariables: EnvVariable[],
  dataConnection?: DataConnectionData,
  existingDataConnection?: DataConnection,
  dryRun = false,
): Promise<EnvironmentFromVariable[]> => {
  const existingEnvVars = await fetchNotebookEnvVariables(notebook);
  const newDataConnection =
    dataConnection?.enabled && dataConnection.type === 'creating' && dataConnection.creating
      ? dataConnection.creating
      : undefined;
  const replaceDataConnection =
    dataConnection?.enabled &&
    dataConnection.type === 'existing' &&
    dataConnection.existing?.secretRef.name !== existingDataConnection?.data.metadata.name
      ? dataConnection.existing
      : undefined;

  const removeDataConnections =
    existingDataConnection &&
    (replaceDataConnection || newDataConnection || !dataConnection?.enabled)
      ? [existingDataConnection.data.metadata.name]
      : [];

  const [oldResources, newResources] = _.partition(envVariables, (envVar) => envVar.existingName);
  const currentNames = oldResources
    .map((envVar) => envVar.existingName)
    .filter((v): v is string => !!v);
  const removeResources = existingEnvVars.filter(
    (envVar) => envVar.existingName && !currentNames.includes(envVar.existingName),
  );

  const [typeChangeResources, updateResources] = _.partition(oldResources, (envVar) =>
    existingEnvVars.find(
      (existingEnvVar) =>
        existingEnvVar.existingName === envVar.existingName &&
        existingEnvVar.values?.category !== envVar.values?.category,
    ),
  );

  const deleteResources = [...removeResources, ...typeChangeResources];
  // will only delete generic files here when updating because we only map them
  const deletingPromises = deleteResources
    .map((envVar) => {
      if (!envVar.existingName) {
        return null;
      }
      switch (envVar.values?.category) {
        case SecretCategory.GENERIC:
          return deleteSecret(projectName, envVar.existingName, { dryRun });
        case ConfigMapCategory.GENERIC:
          return deleteConfigMap(projectName, envVar.existingName, { dryRun });
        default:
          return null;
      }
    })
    .filter((v): v is Promise<K8sStatus> => !!v);
  const creatingPromises = getPromisesForConfigMapsAndSecrets(
    projectName,
    [...newResources, ...typeChangeResources, ...(newDataConnection ? [newDataConnection] : [])],
    'create',
    dryRun,
  );

  const updatingPromises = getPromisesForConfigMapsAndSecrets(
    projectName,
    updateResources,
    'update',
    dryRun,
  );

  const [created] = await Promise.all([
    Promise.all(creatingPromises),
    Promise.all(deletingPromises),
    Promise.all(updatingPromises),
  ]);

  const deletingNames = deleteResources.map((resource) => resource.existingName || '');
  deletingNames.push(...removeDataConnections);

  const envFromList = notebook.spec.template.spec.containers[0].envFrom || [];

  return getEnvFromList(created, [
    ...envFromList,
    ...(replaceDataConnection ? [replaceDataConnection] : []),
  ]).filter(
    (envFrom) =>
      !(envFrom.secretRef?.name && deletingNames.includes(envFrom.secretRef.name)) &&
      !(envFrom.configMapRef?.name && deletingNames.includes(envFrom.configMapRef.name)),
  );
};

const fetchApiKey = async (
  userName: string,
  projectName: string,
  notebookName: string,
  serviceName: string,
): Promise<string> => {
  let host = '';
  if (!DEV_MODE) {
    host = `${window.location.protocol}//${window.location.hostname}`;
  }
  const response: MaasResponse = await proxyCREATE(host, `/api/maas/check-create-application`, {
    // eslint-disable-next-line camelcase
    user_name: userName,
    // eslint-disable-next-line camelcase
    app_name: `parasol-${projectName}-${notebookName}`,
    // eslint-disable-next-line camelcase
    service_name: serviceName,
  });
  return response.message;
};

const fetchApiEndpoint = async (
  serviceName: string,
): Promise<string> => {
  let host = '';
  if (!DEV_MODE) {
    host = `${window.location.protocol}//${window.location.hostname}`;
  }
  const response: MaasResponse = await proxyGET(host, `/api/maas/get-application-plan-endpoint/` + serviceName);
  return response.message;
};

const fetchModelNameBearerAuth = async (
  endpoint: string,
  apiKey: String
): Promise<string> => {
  const response = await fetch(endpoint + "/v1/models", { headers: {"Authorization": "Bearer "+apiKey}});
  const models = await response.json();
  
  return models.data[0].id;
};

const fetchModelNameUserKey = async (
  endpoint: string,
  apiKey: String
): Promise<string> => {
  const response = await fetch(endpoint + "/v1/models?user_key=" + apiKey);
  const models = await response.json();
  
  return models.data[0].id;
};

const fetchVectorDBConfiguration = async (
): Promise<string> => {
  let host = '';
  if (!DEV_MODE) {
    host = `${window.location.protocol}//${window.location.hostname}`;
  }
  const response: MaasResponse = await proxyGET(host, `/api/maas/get-vectordb-configuration`);
  return response.message;
};

const fetchGuardEnabled = async (
): Promise<string> => {
  let host = '';
  if (!DEV_MODE) {
    host = `${window.location.protocol}//${window.location.hostname}`;
  }
  const response: MaasResponse = await proxyGET(host, `/api/maas/is-guard-enabled`);
  return response.message;
};

const fetchSafetyEnabled = async (
): Promise<string> => {
  let host = '';
  if (!DEV_MODE) {
    host = `${window.location.protocol}//${window.location.hostname}`;
  }
  const response: MaasResponse = await proxyGET(host, `/api/maas/is-safety-enabled`);
  return response.message;
};

export const createApiKeyForNotebook = async (
  userName: string,
  projectName: string,
  notebookName: string,
  imageName: string,
): Promise<EnvVariable[]> => {
  try {
    let newEnvVar: EnvVariable;
    let apiKey = '';
    let endpoint = '';
    let modelName = '';

    switch (imageName) {
      case 'custom-custom-cai-anything':
        apiKey = await fetchApiKey(userName, projectName, notebookName, modelImageMap[imageName]);
        endpoint = await fetchApiEndpoint(modelImageMap[imageName]);
        modelName = await fetchModelNameBearerAuth(endpoint, apiKey);
        newEnvVar = {
          type: EnvironmentVariableType.SECRET,
          values: {
            category: SecretCategory.GENERIC,
            data: [
              { key: 'DISABLE_TELEMETRY', value: 'true' },
              { key: 'EMBEDDING_ENGINE', value: 'native' },
              { key: 'GENERIC_OPEN_AI_API_KEY', value: apiKey },
              { key: 'GENERIC_OPEN_AI_BASE_PATH', value: endpoint + '/v1' },
              { key: 'GENERIC_OPEN_AI_MAX_TOKENS', value: '2048' },
              { key: 'GENERIC_OPEN_AI_MODEL_PREF', value: modelName },
              { key: 'LLM_PROVIDER', value: 'generic-openai' },
              { key: 'GENERIC_OPEN_AI_MODEL_TOKEN_LIMIT', value: '4096' },
            ],
          },
        };

        var vectorDB: VectorDBConfiguration = JSON.parse(await fetchVectorDBConfiguration());

        console.info("Configuring VectorDB (" + vectorDB.VECTOR_DB + ")");

        if (vectorDB.VECTOR_DB == "weaviate") {
          const weaviateEndpoint = vectorDB.WEAVIATE_ENDPOINT!;

          console.info("Detected Weaviate as VectorDB (" + weaviateEndpoint + ")");

          newEnvVar.values!.data.push({ key: 'WEAVIATE_ENDPOINT', value: weaviateEndpoint });  
        }
        newEnvVar.values!.data.push({ key: 'VECTOR_DB', value: vectorDB.VECTOR_DB });

        break;
      case 'custom-custom-cai-code':
        apiKey = await fetchApiKey(userName, projectName, notebookName, modelImageMap[imageName]);
        endpoint = await fetchApiEndpoint(modelImageMap[imageName]);
        modelName = await fetchModelNameBearerAuth(endpoint, apiKey);

        newEnvVar = {
          type: EnvironmentVariableType.SECRET,
          values: {
            category: SecretCategory.GENERIC,
            data: [
              { key: 'MODEL_ENDPOINT_URL', value: endpoint + '/v1' },
              { key: 'API_KEY', value: apiKey },
              { key: 'MODEL_NAME', value: modelName },
            ],
          },
        };
        break;
      case 'custom-custom-cai-sdxl':
        let apiKeyGuard = '';
        let apiKeySafety = '';
        let guardEnabled = 'false';
        let safetyEnabled = 'false';
        let guardEndpoint = '';
        let safetyEndpoint = '';
        let modelNameGuard = '';
        let modelNameSafety = '';

        apiKey = await fetchApiKey(userName, projectName, notebookName, modelImageMap[imageName]);
        endpoint = await fetchApiEndpoint(modelImageMap[imageName]);

        guardEnabled = await fetchGuardEnabled();
        console.info("Guard enabled: " + guardEnabled);

        if (guardEnabled == "true") {
          apiKeyGuard = await fetchApiKey(userName, projectName, `${notebookName}-guard`, 'guard');
          guardEndpoint = await fetchApiEndpoint('guard');
          modelNameGuard = await fetchModelNameUserKey(guardEndpoint, apiKeySafety);
        }

        safetyEnabled = await fetchSafetyEnabled();
        console.info("Safety enabled: " + safetyEnabled);

        if (safetyEnabled == "true") {
          apiKeySafety = await fetchApiKey(userName, projectName, `${notebookName}-safety`, 'safety');
          safetyEndpoint = await fetchApiEndpoint('safety');
          modelNameSafety = await fetchModelNameUserKey(safetyEndpoint, apiKeySafety);
        }

        newEnvVar = {
          type: EnvironmentVariableType.SECRET,
          values: {
            category: SecretCategory.GENERIC,
            data: [
              { key: 'PARASOL_MODE', value: 'true' },
              { key: 'SDXL_ENDPOINT_URL', value: endpoint },
              { key: 'SDXL_ENDPOINT_TOKEN', value: apiKey },
              { key: 'GUARD_ENDPOINT_URL', value: guardEndpoint + '/v1' },
              { key: 'GUARD_ENDPOINT_TOKEN', value: apiKeyGuard },
              { key: 'GUARD_ENABLED', value: guardEnabled },
              { key: 'GUARD_MODEL', value: modelNameGuard },
              { key: 'GUARD_TEMP', value: '0.7' },
              { key: 'GUARD_PROMPT_PREFIX', value: 'Draw a picture of' },
              { key: 'SAFETY_CHECK_ENABLED', value: safetyEnabled },
              { key: 'SAFETY_CHECK_ENDPOINT_URL', value: safetyEndpoint },
              { key: 'SAFETY_CHECK_ENDPOINT_TOKEN', value: apiKeySafety },
              { key: 'SAFETY_CHECK_MODEL', value: modelNameSafety }
            ],
          },
        };
        break;
      case 'custom-custom-cai-docling':
        apiKey = await fetchApiKey(userName, projectName, notebookName, modelImageMap[imageName]);
        endpoint = await fetchApiEndpoint(modelImageMap[imageName]);
        newEnvVar = {
          type: EnvironmentVariableType.SECRET,
          values: {
            category: SecretCategory.GENERIC,
            data: [
              { key: 'HOST', value: endpoint },
              { key: 'AUTH_TOKEN', value: apiKey },
            ],
          },
        };
        break;
      default:
        throw new Error(`Unsupported imageName: ${imageName}`);
    }

    return [newEnvVar];
  } catch (e) {
    /* eslint-disable-next-line no-console */
    console.error('Creating API key failed: ', e);
    throw e;
  }
};