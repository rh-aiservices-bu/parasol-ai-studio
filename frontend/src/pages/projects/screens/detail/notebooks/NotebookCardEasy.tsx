import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Flex,
  FlexItem,
  Text,
  TextContent,
  Title,
} from '@patternfly/react-core';
import { ActionsColumn } from '@patternfly/react-table';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import BrandImage from '~/components/BrandImage';
import { getDescriptionFromK8sResource, getDisplayNameFromK8sResource } from '~/concepts/k8s/utils';
import anythingLLMImg from '~/images/anythingllm-logo.svg';
import codeServerImg from '~/images/code-server-logo.svg';
import doclingImg from '~/images/docling-logo.svg';
import stabilityAIImg from '~/images/stabilityai-logo.svg';
import { NotebookKind } from '~/k8sTypes';
import NotebookRouteLink from '~/pages/projects/notebook/NotebookRouteLink';
import NotebookStatusToggle from '~/pages/projects/notebook/NotebookStatusToggle';
import { NotebookState } from '~/pages/projects/notebook/types';
import { ProjectDetailsContext } from '~/pages/projects/ProjectDetailsContext';
import { NotebookSize } from '~/types';
import { NotebookImageAvailability } from './const';
import useNotebookDeploymentSize from './useNotebookDeploymentSize';
import useNotebookImage from './useNotebookImage';

type NotebookTableRowProps = {
  obj: NotebookState;
  onNotebookDelete: (notebook: NotebookKind) => void;
  onNotebookAddStorage: (notebook: NotebookKind) => void;
  compact?: boolean;
};

const NotebookCardEasy: React.FC<NotebookTableRowProps> = ({
  obj,
  onNotebookDelete,
  onNotebookAddStorage,
}) => {
  const { currentProject } = React.useContext(ProjectDetailsContext);
  const navigate = useNavigate();
  const [isExpanded, setExpanded] = React.useState(false);
  const { size: notebookSize } = useNotebookDeploymentSize(obj.notebook);
  const lastDeployedSize: NotebookSize = {
    name: 'Custom',
    resources: obj.notebook.spec.template.spec.containers[0].resources ?? {
      limits: {},
      requests: {},
    },
  };
  const [notebookImage, loaded, loadError] = useNotebookImage(obj.notebook);
  const imageTypeAnnotation =
    obj.notebook.metadata.annotations?.['notebooks.opendatahub.io/last-image-selection'] ||
    'default';
  const imageType = imageTypeAnnotation.split(':')[0];

  let imageToDisplay;
  switch (imageType) {
    case 'custom-custom-cai-anything':
      imageToDisplay = anythingLLMImg;
      break;
    case 'custom-custom-cai-sdxl':
      imageToDisplay = stabilityAIImg;
      break;
    case 'custom-custom-cai-code':
      imageToDisplay = codeServerImg;
      break;
    case 'custom-custom-cai-docling':
      imageToDisplay = doclingImg;
      break;
    default:
      imageToDisplay = null;
  }

  return (
    <Card className="odh-type-bordered-card organize easy-card-full-height">
      <CardHeader>
        <Flex direction={{ default: 'row' }}>
          <FlexItem>
            <BrandImage src={imageToDisplay} alt={imageType} />
          </FlexItem>
          <FlexItem align={{ default: 'alignRight' }} alignSelf={{ default: 'alignSelfFlexStart' }}>
            <ActionsColumn
              items={[
                {
                  isDisabled: obj.isStarting || obj.isStopping,
                  title: 'Edit workbench',
                  onClick: () => {
                    navigate(
                      `/projects/${currentProject.metadata.name}/spawner/${obj.notebook.metadata.name}`,
                    );
                  },
                },
                {
                  title: 'Delete workbench',
                  onClick: () => {
                    onNotebookDelete(obj.notebook);
                  },
                },
              ]}
            />
          </FlexItem>
        </Flex>
      </CardHeader>
      <CardTitle>
        <Title headingLevel="h4">{getDisplayNameFromK8sResource(obj.notebook)}</Title>
      </CardTitle>
      <CardBody>
        <TextContent>
          <Text component="small">{getDescriptionFromK8sResource(obj.notebook)}</Text>
        </TextContent>
      </CardBody>
      <CardFooter>
        <Flex
          justifyContent={{ default: 'justifyContentSpaceBetween' }}
          alignItems={{ default: 'alignItemsCenter' }}
        >
          <FlexItem>
            <NotebookStatusToggle
              notebookState={obj}
              doListen={false}
              isDisabled={
                notebookImage?.imageAvailability === NotebookImageAvailability.DELETED &&
                !obj.isRunning
              }
            />
          </FlexItem>
          <FlexItem>
            <NotebookRouteLink label="Open" notebook={obj.notebook} isRunning={obj.isRunning} />
          </FlexItem>
        </Flex>
      </CardFooter>
    </Card>
  );
};

export default NotebookCardEasy;
