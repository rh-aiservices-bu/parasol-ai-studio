import * as React from 'react';
import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateVariant,
  Flex,
  FlexItem,
  PageSection,
  Stack,
  StackItem,
  Text,
  TextContent,
} from '@patternfly/react-core';
import { useNavigate } from 'react-router-dom';
import useDimensions from 'react-cool-dimensions';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import ManageProjectModal from '~/pages/projects/screens/projects/ManageProjectModal';
import { AccessReviewResourceAttributes } from '~/k8sTypes';
import { useAccessReview } from '~/api';
import { SupportedArea } from '~/concepts/areas';
import useIsAreaAvailable from '~/concepts/areas/useIsAreaAvailable';
import { ProjectsContext } from '~/concepts/projects/ProjectsContext';
import EvenlySpacedGallery from '~/components/EvenlySpacedGallery';
import ProjectsSectionHeaderEasy from './ProjectsSectionHeaderEasy';
import EmptyProjectsCard from './EmptyProjectsCard';
import ProjectsLoading from './ProjectsLoading';
import ProjectCard from './ProjectCard';
import CreateProjectCard from './CreateProjectCard';

const accessReviewResource: AccessReviewResourceAttributes = {
  group: 'project.openshift.io',
  resource: 'projectrequests',
  verb: 'create',
};

const MAX_SHOWN_PROJECTS = 5;
const MIN_CARD_WIDTH = 225;

const ProjectsSectionEasy: React.FC = () => {
  const navigate = useNavigate();

  const { status: projectsAvailable } = useIsAreaAvailable(SupportedArea.DS_PROJECTS_VIEW);
  const { projects: projects, loaded, loadError } = React.useContext(ProjectsContext);
  const [allowCreate, rbacLoaded] = useAccessReview(accessReviewResource);
  const [createProjectOpen, setCreateProjectOpen] = React.useState<boolean>(false);
  const [visibleCardCount, setVisibleCardCount] = React.useState<number>(5);

  const { observe } = useDimensions({
    onResize: ({ width }) => {
      setVisibleCardCount(Math.min(MAX_SHOWN_PROJECTS, Math.floor(width / MIN_CARD_WIDTH)));
    },
  });

  const shownProjects = React.useMemo(
    () => (loaded ? projects.slice(0, visibleCardCount) : []),
    [loaded, projects, visibleCardCount],
  );

  if (!projectsAvailable) {
    return null;
  }

  const numCards = Math.min(projects.length + 1, visibleCardCount);
  const showCreateCard = projects.length < visibleCardCount;

  const onCreateProject = () => setCreateProjectOpen(true);

  return (
    <PageSection data-testid="landing-page-projects">
      <Stack hasGutter>
        <StackItem>
          <ProjectsSectionHeaderEasy
            showCreate={!showCreateCard}
            allowCreate={allowCreate}
            onCreateProject={onCreateProject}
          />
        </StackItem>
        <StackItem>
          {loadError ? (
            <EmptyState variant={EmptyStateVariant.lg} data-id="error-empty-state">
              <EmptyStateHeader
                titleText="Error loading projects"
                icon={<EmptyStateIcon icon={ExclamationCircleIcon} />}
                headingLevel="h3"
              />
              <EmptyStateBody>{loadError.message}</EmptyStateBody>
            </EmptyState>
          ) : !rbacLoaded || !loaded ? (
            <ProjectsLoading />
          ) : !projects.length ? (
            <EmptyProjectsCard allowCreate={allowCreate} onCreateProject={onCreateProject} />
          ) : (
            <div ref={observe}>
              <EvenlySpacedGallery hasGutter itemCount={numCards}>
                {shownProjects.map((project) => (
                  <ProjectCard key={project.metadata.name} project={project} />
                ))}
                {showCreateCard ? (
                  <CreateProjectCard allowCreate={allowCreate} onCreateProject={onCreateProject} />
                ) : null}
              </EvenlySpacedGallery>
            </div>
          )}
        </StackItem>
        <StackItem>
          <Flex gap={{ default: 'gapMd' }} alignItems={{ default: 'alignItemsCenter' }}>
            <FlexItem>
              {shownProjects.length ? (
                <TextContent>
                  <Text component="small">
                    {shownProjects.length < projects.length
                      ? `${shownProjects.length} of ${projects.length} projects`
                      : 'Showing all projects'}
                  </Text>
                </TextContent>
              ) : null}
            </FlexItem>
            <FlexItem>
              <Button
                data-testid="goto-projects-link"
                component="a"
                isInline
                variant="link"
                onClick={() => navigate('/projects')}
              >
                Go to <b>My Projects</b> to see all projects
              </Button>
            </FlexItem>
          </Flex>
        </StackItem>
      </Stack>
      {createProjectOpen ? (
        <ManageProjectModal
          open
          onClose={(newProjectName) => {
            if (newProjectName) {
              navigate(`/projects/${newProjectName}`);
              return;
            }
            setCreateProjectOpen(false);
          }}
        />
      ) : null}
    </PageSection>
  );
};

export default ProjectsSectionEasy;
