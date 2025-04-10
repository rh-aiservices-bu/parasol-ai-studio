import * as React from 'react';
import ApplicationsPage from '~/pages/ApplicationsPage';
import { useAccessReview } from '~/api';
import { AccessReviewResourceAttributes } from '~/k8sTypes';
import { ProjectsContext } from '~/concepts/projects/ProjectsContext';
import { ProjectObjectType } from '~/concepts/design/utils';
import TitleWithIcon from '~/concepts/design/TitleWithIcon';
import EmptyProjects from './EmptyProjects';
import ProjectListViewEasy from './ProjectListViewEasy';

const accessReviewResource: AccessReviewResourceAttributes = {
  group: 'project.openshift.io',
  resource: 'projectrequests',
  verb: 'create',
};

const ProjectViewEasy: React.FC = () => {
  const { projects } = React.useContext(ProjectsContext);
  const [allowCreate, rbacLoaded] = useAccessReview(accessReviewResource);

  return (
    <ApplicationsPage
      title={<TitleWithIcon title="My Projects" objectType={ProjectObjectType.project} />}
      description={
        rbacLoaded
          ? `View your existing projects${allowCreate ? ' or create new projects' : ''}.`
          : undefined
      }
      loaded={rbacLoaded}
      empty={projects.length === 0}
      emptyStatePage={<EmptyProjects allowCreate={allowCreate} />}
      provideChildrenPadding
      removeChildrenTopPadding
    >
      <ProjectListViewEasy allowCreate={allowCreate} />
    </ApplicationsPage>
  );
};

export default ProjectViewEasy;
