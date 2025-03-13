import * as React from 'react';
import { FormGroup, Label, Split, SplitItem } from '@patternfly/react-core';
import { BuildStatus } from '~/pages/projects/screens/spawner/types';
import {
  checkImageStreamAvailability,
  compareImageStreamOrder,
  getImageStreamDisplayName,
  getRelatedVersionDescription,
  isCompatibleWithAccelerator,
} from '~/pages/projects/screens/spawner/spawnerUtils';
import { ImageStreamKind } from '~/k8sTypes';
import SimpleSelect from '~/components/SimpleSelect';
import logoAnythingLLM from '~/images/anythingllm-logo.svg';
import logoStable from '~/images/stabilityai-logo.svg';
import logoCodeServer from '~/images/code-server-logo.svg';
import logoDocling from '~/images/docling-logo.svg';

type ImageStreamSelectorProps = {
  imageStreams: ImageStreamKind[];
  buildStatuses: BuildStatus[];
  selectedImageStream?: ImageStreamKind;
  onImageStreamSelect: (selection: ImageStreamKind) => void;
  compatibleAcceleratorIdentifier?: string;
};

const imageMap: { [key: string]: string } = {
  'custom-custom-cai-anything': logoAnythingLLM,
  'custom-custom-cai-sdxl': logoStable,
  'custom-custom-cai-code': logoCodeServer,
  'custom-custom-cai-docling': logoDocling,
};

const getImageUrl = (name: string): string => imageMap[name] || ''; // Return a default image if the name is not found

const ImageStreamSelectorEasy: React.FC<ImageStreamSelectorProps> = ({
  imageStreams,
  selectedImageStream,
  onImageStreamSelect,
  buildStatuses,
  compatibleAcceleratorIdentifier,
}) => {
  const options = imageStreams.toSorted(compareImageStreamOrder).map((imageStream) => {
    const description = getRelatedVersionDescription(imageStream);
    const displayName = getImageStreamDisplayName(imageStream);
    const imageUrl = getImageUrl(imageStream.metadata.name);

    return {
      key: imageStream.metadata.name,
      label: displayName,
      description,
      disabled: !checkImageStreamAvailability(imageStream, buildStatuses),
      dropdownLabel: (
        <Split>
          <SplitItem style={{ display: 'flex', alignItems: 'center' }}>
            <img
              src={imageUrl}
              alt={imageStream.metadata.name}
              width="25"
              height="25"
              style={{ paddingRight: '10px' }}
            />
          </SplitItem>
          <SplitItem>{displayName}</SplitItem>
          <SplitItem isFilled />
          <SplitItem>
            {isCompatibleWithAccelerator(compatibleAcceleratorIdentifier, imageStream) && (
              <Label color="blue">Compatible with accelerator</Label>
            )}
          </SplitItem>
        </Split>
      ),
    };
  });

  return (
    <FormGroup isRequired label="Type" fieldId="workbench-image-stream-selection">
      <SimpleSelect
        isScrollable
        isFullWidth
        id="workbench-image-stream-selection"
        dataTestId="workbench-image-stream-selection"
        aria-label="Select an image"
        options={options}
        placeholder="Select one"
        value={selectedImageStream?.metadata.name ?? ''}
        onChange={(key) => {
          const imageStream = imageStreams.find(
            (currentImageStream) => currentImageStream.metadata.name === key,
          );
          if (imageStream) {
            onImageStreamSelect(imageStream);
          }
        }}
      />
    </FormGroup>
  );
};

export default ImageStreamSelectorEasy;
