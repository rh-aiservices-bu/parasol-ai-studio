import * as React from 'react';
import { useParams } from 'react-router';
import {
  Bullseye,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Spinner,
  EmptyStateHeader,
  EmptyStateFooter,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { useNavigate } from 'react-router-dom';
import { ProjectDetailsContext } from '~/pages/projects/ProjectDetailsContext';
import { NotebookState } from '~/pages/projects/notebook/types';
import { getDisplayNameFromK8sResource } from '~/concepts/k8s/utils';
import SpawnerPageEasy from './SpawnerPageEasy';

const EditSpawnerPageEasy: React.FC = () => {
  const {
    currentProject,
    notebooks: { data, loaded, error },
  } = React.useContext(ProjectDetailsContext);
  const navigate = useNavigate();
  const { notebookName } = useParams();
  const ref = React.useRef<NotebookState>();
  if (!ref.current) {
    ref.current = data.find(
      (notebookState) => notebookState.notebook.metadata.name === notebookName,
    );
  }

  if (error) {
    return (
      <Bullseye>
        <EmptyState>
          <EmptyStateHeader
            titleText="Problem loading project details"
            icon={<EmptyStateIcon icon={ExclamationCircleIcon} />}
            headingLevel="h4"
          />
          <EmptyStateBody>{error.message}</EmptyStateBody>
          <EmptyStateFooter>
            <Button variant="primary" onClick={() => navigate('/projects')}>
              View my projects
            </Button>
          </EmptyStateFooter>
        </EmptyState>
      </Bullseye>
    );
  }

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (!ref.current) {
    return (
      <Bullseye>
        <EmptyState>
          <EmptyStateHeader
            data-testid="error-message-title"
            titleText="Unable to edit workbench"
            icon={<EmptyStateIcon icon={ExclamationCircleIcon} />}
            headingLevel="h4"
          />
          <EmptyStateBody>
            We were unable to find a notebook by this name in your project{' '}
            {getDisplayNameFromK8sResource(currentProject)}.
          </EmptyStateBody>
          <EmptyStateFooter>
            <Button
              data-testid="return-to-project-button"
              variant="primary"
              onClick={() => navigate(`/projects/${currentProject.metadata.name}`)}
            >
              Return to {getDisplayNameFromK8sResource(currentProject)}
            </Button>
          </EmptyStateFooter>
        </EmptyState>
      </Bullseye>
    );
  }

  return <SpawnerPageEasy existingNotebook={ref.current.notebook} />;
};

export default EditSpawnerPageEasy;
