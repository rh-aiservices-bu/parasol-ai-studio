import * as React from 'react';
import { FormGroup, FormSection, Stack, StackItem, Popover, Icon } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { UpdateObjectAtPropAndValue } from '~/pages/projects/types';
import {
  CreatingInferenceServiceObject,
  CreatingServingRuntimeObject,
  ModelServingSize,
} from '~/pages/modelServing/screens/types';
import { ServingRuntimeKind } from '~/k8sTypes';
import { isGpuDisabled } from '~/pages/modelServing/screens/projects/utils';
import AcceleratorProfileSelectField from '~/pages/notebookController/screens/server/AcceleratorProfileSelectField';
import { getCompatibleAcceleratorIdentifiers } from '~/pages/projects/screens/spawner/spawnerUtils';
import { AcceleratorProfileState } from '~/utilities/useAcceleratorProfileState';
import SimpleSelect from '~/components/SimpleSelect';
import ServingRuntimeSizeExpandedField from './ServingRuntimeSizeExpandedField';

type ServingRuntimeSizeSectionProps = {
  data: CreatingServingRuntimeObject | CreatingInferenceServiceObject;
  setData:
    | UpdateObjectAtPropAndValue<CreatingServingRuntimeObject>
    | UpdateObjectAtPropAndValue<CreatingInferenceServiceObject>;
  sizes: ModelServingSize[];
  servingRuntimeSelected?: ServingRuntimeKind;
  acceleratorProfileState: AcceleratorProfileState;
  setAcceleratorProfileState: UpdateObjectAtPropAndValue<AcceleratorProfileState>;
  infoContent?: string;
};

const ServingRuntimeSizeSection: React.FC<ServingRuntimeSizeSectionProps> = ({
  data,
  setData,
  sizes,
  servingRuntimeSelected,
  acceleratorProfileState,
  setAcceleratorProfileState,
  infoContent,
}) => {
  const [supportedAcceleratorProfiles, setSupportedAcceleratorProfiles] = React.useState<
    string[] | undefined
  >();

  React.useEffect(() => {
    if (servingRuntimeSelected) {
      setSupportedAcceleratorProfiles(getCompatibleAcceleratorIdentifiers(servingRuntimeSelected));
    } else {
      setSupportedAcceleratorProfiles(undefined);
    }
  }, [servingRuntimeSelected]);

  const gpuDisabled = servingRuntimeSelected ? isGpuDisabled(servingRuntimeSelected) : false;
  const sizeCustom = [
    ...sizes,
    {
      name: 'Custom',
      resources: sizes[0].resources,
    },
  ];

  const sizeOptions = () =>
    sizeCustom.map((size) => {
      const { name } = size;
      const desc =
        name !== 'Custom'
          ? `Limits: ${size.resources.limits?.cpu || '??'} CPU, ` +
            `${size.resources.limits?.memory || '??'} Memory ` +
            `Requests: ${size.resources.requests?.cpu || '??'} CPU, ` +
            `${size.resources.requests?.memory || '??'} Memory`
          : '';
      return { key: name, label: name, description: desc };
    });

  return (
    <FormSection title="Compute resources per replica">
      <FormGroup
        label="Model server size"
        labelIcon={
          infoContent ? (
            <Popover bodyContent={<div>{infoContent}</div>}>
              <Icon aria-label="Model server size info" role="button">
                <OutlinedQuestionCircleIcon />
              </Icon>
            </Popover>
          ) : undefined
        }
      >
        <Stack hasGutter>
          <StackItem>
            <SimpleSelect
              dataTestId="model-server-size-selection"
              isFullWidth
              options={sizeOptions()}
              toggleLabel={data.modelSize.name || 'Select a model server size'}
              onChange={(option) => {
                const valuesSelected = sizeCustom.find((element) => element.name === option);
                if (valuesSelected) {
                  setData('modelSize', valuesSelected);
                }
              }}
              popperProps={{ appendTo: document.body }}
            />
          </StackItem>
          {data.modelSize.name === 'Custom' && (
            <StackItem>
              <ServingRuntimeSizeExpandedField data={data} setData={setData} />
            </StackItem>
          )}
        </Stack>
      </FormGroup>
      {!gpuDisabled && (
        <FormGroup>
          <AcceleratorProfileSelectField
            acceleratorProfileState={acceleratorProfileState}
            setAcceleratorProfileState={setAcceleratorProfileState}
            supportedAcceleratorProfiles={supportedAcceleratorProfiles}
            resourceDisplayName="serving runtime"
            infoContent="Ensure that appropriate tolerations are in place before adding an accelerator to your model server."
          />
        </FormGroup>
      )}
    </FormSection>
  );
};

export default ServingRuntimeSizeSection;
