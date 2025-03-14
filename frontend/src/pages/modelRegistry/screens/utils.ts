import { SearchType } from '~/concepts/dashboard/DashboardSearchField';
import {
  ModelRegistryBase,
  ModelRegistryCustomProperties,
  ModelRegistryMetadataType,
  ModelRegistryStringCustomProperties,
  ModelVersion,
  RegisteredModel,
} from '~/concepts/modelRegistry/types';
import { KeyValuePair } from '~/types';

// Retrieves the labels from customProperties that have non-empty string_value.
export const getLabels = <T extends ModelRegistryCustomProperties>(customProperties: T): string[] =>
  Object.keys(customProperties).filter((key) => {
    const prop = customProperties[key];
    return prop.metadataType === ModelRegistryMetadataType.STRING && prop.string_value === '';
  });

// Returns the customProperties object with an updated set of labels (non-empty string_value) without affecting other properties.
export const mergeUpdatedLabels = (
  customProperties: ModelRegistryCustomProperties,
  updatedLabels: string[],
): ModelRegistryCustomProperties => {
  const existingLabels = getLabels(customProperties);
  const addedLabels = updatedLabels.filter((label) => !existingLabels.includes(label));
  const removedLabels = existingLabels.filter((label) => !updatedLabels.includes(label));
  const customPropertiesCopy = { ...customProperties };
  removedLabels.forEach((label) => {
    delete customPropertiesCopy[label];
  });
  addedLabels.forEach((label) => {
    customPropertiesCopy[label] = {
      // eslint-disable-next-line camelcase
      string_value: '',
      metadataType: ModelRegistryMetadataType.STRING,
    };
  });
  return customPropertiesCopy;
};

// Retrives the customProperties that are not labels (they have a defined string_value).
export const getProperties = <T extends ModelRegistryCustomProperties>(
  customProperties: T,
): ModelRegistryStringCustomProperties => {
  const initial: ModelRegistryStringCustomProperties = {};
  return Object.keys(customProperties).reduce((acc, key) => {
    const prop = customProperties[key];
    if (prop.metadataType === ModelRegistryMetadataType.STRING && prop.string_value !== '') {
      return { ...acc, [key]: prop };
    }
    return acc;
  }, initial);
};

// Returns the customProperties object with a single string property added, updated or deleted
export const mergeUpdatedProperty = (
  args: { customProperties: ModelRegistryCustomProperties } & (
    | { op: 'create'; newPair: KeyValuePair }
    | { op: 'update'; oldKey: string; newPair: KeyValuePair }
    | { op: 'delete'; oldKey: string }
  ),
): ModelRegistryCustomProperties => {
  const { op } = args;
  const customPropertiesCopy = { ...args.customProperties };
  if (op === 'delete' || (op === 'update' && args.oldKey !== args.newPair.key)) {
    delete customPropertiesCopy[args.oldKey];
  }
  if (op === 'create' || op === 'update') {
    const { key, value } = args.newPair;
    customPropertiesCopy[key] = {
      // eslint-disable-next-line camelcase
      string_value: value,
      metadataType: ModelRegistryMetadataType.STRING,
    };
  }
  return customPropertiesCopy;
};

// Returns a patch payload for a Model Registry object, retaining all mutable fields but excluding internal fields to prevent errors
// TODO this will not be necessary if the backend eventually merges objects on PATCH requests. See https://issues.redhat.com/browse/RHOAIENG-6652
export const getPatchBody = <T extends ModelRegistryBase>(
  existingObj: T,
  updates: Partial<T>,
  otherExcludedKeys: (keyof T)[],
): Partial<T> => {
  const objCopy = { ...existingObj };
  const excludedKeys: (keyof T)[] = [
    'id',
    'name',
    'createTimeSinceEpoch',
    'lastUpdateTimeSinceEpoch',
    ...otherExcludedKeys,
  ];
  excludedKeys.forEach((key) => {
    delete objCopy[key];
  });
  return { ...objCopy, ...updates };
};

export const getPatchBodyForRegisteredModel = (
  existing: RegisteredModel,
  updates: Partial<RegisteredModel>,
): Partial<RegisteredModel> => getPatchBody(existing, updates, []);

export const getPatchBodyForModelVersion = (
  existing: ModelVersion,
  updates: Partial<ModelVersion>,
): Partial<ModelVersion> => getPatchBody(existing, updates, ['registeredModelId']);

export const filterModelVersions = (
  unfilteredModelVersions: ModelVersion[],
  search: string,
  searchType: SearchType,
): ModelVersion[] =>
  unfilteredModelVersions.filter((mv: ModelVersion) => {
    if (!search) {
      return true;
    }

    switch (searchType) {
      case SearchType.KEYWORD:
        return (
          mv.name.toLowerCase().includes(search.toLowerCase()) ||
          (mv.description && mv.description.toLowerCase().includes(search.toLowerCase()))
        );

      case SearchType.AUTHOR:
        return (
          mv.author &&
          (mv.author.toLowerCase().includes(search.toLowerCase()) ||
            (mv.author && mv.author.toLowerCase().includes(search.toLowerCase())))
        );

      default:
        return true;
    }
  });

export const filterRegisteredModels = (
  unfilteredRegisteredModels: RegisteredModel[],
  search: string,
  searchType: SearchType,
): RegisteredModel[] =>
  unfilteredRegisteredModels.filter((rm: RegisteredModel) => {
    if (!search) {
      return true;
    }

    switch (searchType) {
      case SearchType.KEYWORD:
        return (
          rm.name.toLowerCase().includes(search.toLowerCase()) ||
          (rm.description && rm.description.toLowerCase().includes(search.toLowerCase()))
        );

      case SearchType.OWNER:
        return rm.owner && rm.owner.toLowerCase().includes(search.toLowerCase());

      default:
        return true;
    }
  });
