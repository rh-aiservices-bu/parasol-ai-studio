import * as React from 'react';
import { Navigate, Route } from 'react-router-dom';
import ProjectModelMetricsWrapper from '~/pages/modelServing/screens/projects/ProjectModelMetricsWrapper';
import ProjectServerMetricsWrapper from '~/pages/modelServing/screens/projects/ProjectServerMetricsWrapper';
import useModelMetricsEnabled from '~/pages/modelServing/useModelMetricsEnabled';
import ProjectsRoutes from '~/concepts/projects/ProjectsRoutes';
import ProjectModelMetricsConfigurationPage from '~/pages/modelServing/screens/projects/ProjectModelMetricsConfigurationPage';
import ProjectModelMetricsPage from '~/pages/modelServing/screens/projects/ProjectModelMetricsPage';
import ProjectInferenceExplainabilityWrapper from '~/pages/modelServing/screens/projects/ProjectInferenceExplainabilityWrapper';
import { SupportedArea, useIsAreaAvailable } from '~/concepts/areas';
import { useMode } from '~/redux/selectors/mode';
import ProjectDetails from './screens/detail/ProjectDetails';
import ProjectView from './screens/projects/ProjectView';
import ProjectViewEasy from './screens/projects/ProjectViewEasy';
import ProjectDetailsContextProvider from './ProjectDetailsContext';
import SpawnerPage from './screens/spawner/SpawnerPage';
import SpawnerPageEasy from './screens/spawner/SpawnerPageEasy';
import EditSpawnerPage from './screens/spawner/EditSpawnerPage';
import EditSpawnerPageEasy from './screens/spawner/EditSpawnerPageEasy';

const ProjectViewRoutes: React.FC = () => {
  const [modelMetricsEnabled] = useModelMetricsEnabled();
  const biasMetricsAreaAvailable = useIsAreaAvailable(SupportedArea.BIAS_METRICS).status;
  const performanceMetricsAreaAvailable = useIsAreaAvailable(
    SupportedArea.PERFORMANCE_METRICS,
  ).status;
  const { isEasyMode } = useMode();

  return (
    <ProjectsRoutes>
      {isEasyMode && <Route path="/" element={<ProjectViewEasy />} />}
      {!isEasyMode && <Route path="/" element={<ProjectView />} />}
      <Route path="/:namespace/*" element={<ProjectDetailsContextProvider />}>
        <Route index element={<ProjectDetails />} />
        {isEasyMode && <Route path="spawner" element={<SpawnerPageEasy />} />}
        {!isEasyMode && <Route path="spawner" element={<SpawnerPage />} />}
        {isEasyMode && <Route path="spawner/:notebookName" element={<EditSpawnerPageEasy />} />}
        {!isEasyMode && <Route path="spawner/:notebookName" element={<EditSpawnerPage />} />}
        {modelMetricsEnabled && (
          <>
            <Route path="metrics/model" element={<ProjectInferenceExplainabilityWrapper />}>
              <Route index element={<Navigate to=".." />} />
              <Route path=":inferenceService" element={<ProjectModelMetricsWrapper />}>
                <Route path=":tab?" element={<ProjectModelMetricsPage />} />
                {biasMetricsAreaAvailable && (
                  <Route path="configure" element={<ProjectModelMetricsConfigurationPage />} />
                )}
              </Route>
              <Route path="*" element={<Navigate to="." />} />
            </Route>
            {performanceMetricsAreaAvailable && (
              <Route
                path="metrics/server/:servingRuntime"
                element={<ProjectServerMetricsWrapper />}
              />
            )}
          </>
        )}
        <Route path="*" element={<Navigate to="." />} />
      </Route>
      <Route path="*" element={<Navigate to="." />} />
    </ProjectsRoutes>
  );
};

export default ProjectViewRoutes;
