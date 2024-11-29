import * as React from 'react';
import { Alert, Skeleton } from '@patternfly/react-core';
import { ImageStreamKind } from '~/k8sTypes';
import {
  getDefaultVersionForImageStream,
  getExistingVersionsForImageStream,
  isInvalidBYONImageStream,
} from '~/pages/projects/screens/spawner/spawnerUtils';
import { ImageStreamAndVersion } from '~/types';
import useImageStreams from '~/pages/projects/screens/spawner/useImageStreams';
import { useDashboardNamespace } from '~/redux/selectors';
import useBuildStatuses from '~/pages/projects/screens/spawner/useBuildStatuses';
import ImageStreamPopover from './ImageStreamPopover';
import ImageVersionSelector from './ImageVersionSelector';
import ImageStreamSelectorEasy from './ImageStreamSelectorEasy';

type ImageSelectorFieldProps = {
  selectedImage: ImageStreamAndVersion;
  setSelectedImage: React.Dispatch<React.SetStateAction<ImageStreamAndVersion>>;
  compatibleAcceleratorIdentifier?: string;
};

const ImageSelectorFieldEasy: React.FC<ImageSelectorFieldProps> = ({
  selectedImage,
  setSelectedImage,
  compatibleAcceleratorIdentifier,
}) => {
  const { dashboardNamespace } = useDashboardNamespace();
  const buildStatuses = useBuildStatuses(dashboardNamespace);
  const [imageStreams, loaded, error] = useImageStreams(dashboardNamespace);

  const imageVersionData = React.useMemo(() => {
    const { imageStream } = selectedImage;
    if (!imageStream) {
      return { buildStatuses, imageStream, imageVersions: [] };
    }
    return {
      buildStatuses,
      imageStream,
      imageVersions: getExistingVersionsForImageStream(imageStream),
    };
  }, [selectedImage, buildStatuses]);

  const onImageStreamSelect = (newImageStream: ImageStreamKind) => {
    const version = getDefaultVersionForImageStream(newImageStream, buildStatuses);
    const versions = getExistingVersionsForImageStream(newImageStream);
    const initialVersion = versions.find((v) => v.name === version?.name);

    return setSelectedImage({
      imageStream: newImageStream,
      imageVersion: initialVersion,
    });
  };

  if (error) {
    return (
      <Alert title="Image loading error" variant="danger">
        {error.message}
      </Alert>
    );
  }

  if (!loaded) {
    return <Skeleton />;
  }

  return (
    <>
      <ImageStreamSelectorEasy
        imageStreams={imageStreams.filter(
          (imageStream) =>
            imageStream.metadata.name.startsWith('custom-custom-cai') &&
            !isInvalidBYONImageStream(imageStream),
        )}
        buildStatuses={buildStatuses}
        onImageStreamSelect={onImageStreamSelect}
        selectedImageStream={selectedImage.imageStream}
        compatibleAcceleratorIdentifier={compatibleAcceleratorIdentifier}
      />
      <ImageVersionSelector
        data={imageVersionData}
        setSelectedImageVersion={(selection) =>
          setSelectedImage((oldSelectedImage) => ({
            ...oldSelectedImage,
            imageVersion: selection,
          }))
        }
        selectedImageVersion={selectedImage.imageVersion}
      />
      <ImageStreamPopover selectedImage={selectedImage} />
    </>
  );
};

export default ImageSelectorFieldEasy;
