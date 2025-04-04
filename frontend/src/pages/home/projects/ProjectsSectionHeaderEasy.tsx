import * as React from 'react';
import {
  Button,
  Flex,
  FlexItem,
  Icon,
  Popover,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import HeaderIcon from '~/concepts/design/HeaderIcon';
import { ProjectObjectType, SectionType } from '~/concepts/design/utils';

interface ProjectsSectionHeaderProps {
  showCreate: boolean;
  allowCreate: boolean;
  onCreateProject: () => void;
}

const ProjectsSectionHeaderEasy: React.FC<ProjectsSectionHeaderProps> = ({
  showCreate,
  allowCreate,
  onCreateProject,
}) => (
  <Flex
    gap={{ default: 'gapSm' }}
    alignItems={{ default: 'alignItemsCenter' }}
    justifyContent={{ default: 'justifyContentSpaceBetween' }}
  >
    <FlexItem>
      <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }}>
        <FlexItem>
          <HeaderIcon type={ProjectObjectType.project} sectionType={SectionType.organize} />
        </FlexItem>
        <FlexItem>
          <TextContent>
            <Text component={TextVariants.h1}>My Projects</Text>
          </TextContent>
        </FlexItem>
        {showCreate && !allowCreate ? (
          <FlexItem>
            <Popover
              headerContent={<div>Additional projects request</div>}
              bodyContent={
                <div>Contact your administrator to request a project creation for you.</div>
              }
            >
              <Icon
                data-testid="request-project-help"
                aria-label="Additional projects request"
                role="button"
              >
                <OutlinedQuestionCircleIcon />
              </Icon>
            </Popover>
          </FlexItem>
        ) : null}
      </Flex>
    </FlexItem>
    {showCreate && allowCreate ? (
      <FlexItem>
        <Button data-testid="create-project" variant="secondary" onClick={onCreateProject}>
          Create project
        </Button>
      </FlexItem>
    ) : null}
  </Flex>
);

export default ProjectsSectionHeaderEasy;
