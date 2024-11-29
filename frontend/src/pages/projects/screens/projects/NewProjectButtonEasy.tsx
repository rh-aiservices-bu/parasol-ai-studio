import * as React from 'react';
import { Button } from '@patternfly/react-core';
import ManageProjectModalEasy from './ManageProjectModalEasy';

type NewProjectButtonProps = {
  closeOnCreate?: boolean;
  onProjectCreated?: (projectName: string) => void;
};

const NewProjectButtonEasy: React.FC<NewProjectButtonProps> = ({
  closeOnCreate,
  onProjectCreated,
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        data-testid="create-data-science-project"
        variant="primary"
        onClick={() => setOpen(true)}
      >
        Create project
      </Button>
      <ManageProjectModalEasy
        open={open}
        onClose={(newProjectName) => {
          if (newProjectName) {
            if (onProjectCreated) {
              onProjectCreated(newProjectName);
            } else if (closeOnCreate) {
              setOpen(false);
            }
            return;
          }

          setOpen(false);
        }}
      />
    </>
  );
};

export default NewProjectButtonEasy;
