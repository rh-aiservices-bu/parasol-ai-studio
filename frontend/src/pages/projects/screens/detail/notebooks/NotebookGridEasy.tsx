import * as React from 'react';
import { Table } from '~/components/table';
import { NotebookKind } from '~/k8sTypes';
import DeleteNotebookModal from '~/pages/projects/notebook/DeleteNotebookModal';
import AddNotebookStorage from '~/pages/projects/pvc/AddNotebookStorage';
import { NotebookState } from '~/pages/projects/notebook/types';
import CanEnableElyraPipelinesCheck from '~/concepts/pipelines/elyra/CanEnableElyraPipelinesCheck';
import { ProjectDetailsContext } from '~/pages/projects/ProjectDetailsContext';
import { ElyraInvalidVersionAlerts } from '~/concepts/pipelines/elyra/ElyraInvalidVersionAlerts';
import NotebookCardEasy from './NotebookCardEasy';
import { columns } from './data';
import { Grid, GridItem } from '@patternfly/react-core';

type NotebookTableProps = {
  notebookStates: NotebookState[];
  refresh: () => void;
};

const NotebookGridEasy: React.FC<NotebookTableProps> = ({ notebookStates, refresh }) => {
  const { currentProject } = React.useContext(ProjectDetailsContext);
  const [addNotebookStorage, setAddNotebookStorage] = React.useState<NotebookKind | undefined>();
  const [notebookToDelete, setNotebookToDelete] = React.useState<NotebookKind | undefined>();

  return (
    <>
      <Grid hasGutter>
        {notebookStates.map((item) => (
          <GridItem key={item.notebook.metadata.name} span={3}>
            <NotebookCardEasy
              obj={item}
              onNotebookDelete={setNotebookToDelete}
              onNotebookAddStorage={setAddNotebookStorage}
            />
          </GridItem>
        ))}
      </Grid>
      <AddNotebookStorage
        notebook={addNotebookStorage}
        onClose={(submitted) => {
          if (submitted) {
            refresh();
          }
          setAddNotebookStorage(undefined);
        }}
      />
      <DeleteNotebookModal
        notebook={notebookToDelete}
        onClose={(deleted) => {
          if (deleted) {
            refresh();
          }
          setNotebookToDelete(undefined);
        }}
      />
    </>
  );
};

export default NotebookGridEasy;
