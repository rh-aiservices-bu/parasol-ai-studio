import {
  Flex,
  FlexItem,
  Nav,
  NavExpandable,
  NavItem,
  NavList,
  PageSidebar,
  PageSidebarBody,
  Text,
  TextVariants,
} from '@patternfly/react-core';
import axios from 'axios';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import starLogo from '~/images/star.svg';
import githubLogo from '~/images/github-mark-white.svg';
import forkLogo from '~/images/fork.svg';
import { isNavDataGroup, NavDataGroup, NavDataHref, useBuildNavData } from '~/utilities/NavData';

const checkLinkActiveStatus = (pathname: string, href: string) =>
  href.split('/')[1] === pathname.split('/')[1];

const NavHref: React.FC<{ item: NavDataHref; pathname: string }> = ({ item, pathname }) => (
  <NavItem
    key={item.id}
    data-id={item.id}
    itemId={item.id}
    isActive={checkLinkActiveStatus(pathname, item.href)}
  >
    <Link to={item.href}>{item.label}</Link>
  </NavItem>
);

const NavGroup: React.FC<{ item: NavDataGroup; pathname: string }> = ({ item, pathname }) => {
  const { group, children } = item;
  const isActive = !!children.find((c) => checkLinkActiveStatus(pathname, c.href));
  const [expanded, setExpanded] = React.useState(isActive);

  // Whenever the group becomes active, it should also be expanded
  React.useEffect(() => {
    if (isActive) {
      setExpanded(true);
    }
  }, [isActive]);

  return (
    <NavExpandable
      data-id={group.id}
      key={group.id}
      id={group.id}
      title={group.title}
      groupId={group.id}
      isActive={isActive}
      isExpanded={expanded}
      onExpand={(e, val) => setExpanded(val)}
      aria-label={group.title}
    >
      {children.map((childItem) => (
        <NavHref key={childItem.id} data-id={childItem.id} item={childItem} pathname={pathname} />
      ))}
    </NavExpandable>
  );
};

const NavSidebar: React.FC = () => {
  const routerLocation = useLocation();
  const userNavData = useBuildNavData();
  const [repoStars, setRepoStars] = React.useState<number | null>(null);
  const [repoForks, setRepoForks] = React.useState<number | null>(null);

  // Fetch GitHub stars and forks
  React.useEffect(() => {
    axios
      .get('https://api.github.com/repos/rh-aiservices-bu/parasol-ai-studio')
      .then((response) => {
        setRepoStars(response.data.stargazers_count);
        setRepoForks(response.data.forks_count);
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch GitHub stars:', error);
      });
  }, []);

  return (
    <PageSidebar theme="dark">
      <PageSidebarBody
        isFilled
        style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        <Nav theme="dark" aria-label="Nav">
          <NavList>
            {userNavData.map((item) =>
              isNavDataGroup(item) ? (
                <NavGroup key={item.id} item={item} pathname={routerLocation.pathname} />
              ) : (
                <NavHref key={item.id} item={item} pathname={routerLocation.pathname} />
              ),
            )}
          </NavList>
        </Nav>
        <div style={{ marginTop: 'auto', padding: '1rem', textAlign: 'center' }}>
          <Text component={TextVariants.small}>
            PoC App by{' '}
            <a href="http://red.ht/cai-team" target="_blank" rel="noreferrer">
              red.ht/cai-team
            </a>
            <br />
            <Flex direction={{ default: 'column' }} style={{ width: '100%', alignItems: 'center' }}>
              <FlexItem style={{ marginBottom: '0rem' }}>
                <Flex direction={{ default: 'row' }} alignItems={{ default: 'alignItemsCenter' }}>
                  <a
                    href="https://github.com/rh-aiservices-bu/parasol-ai-studio"
                    target="_blank"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '0.5rem',
                    }}
                    rel="noreferrer"
                  >
                    <FlexItem>
                      <img
                        src={githubLogo}
                        alt="GitHub Logo"
                        style={{ height: '20px', marginRight: '0.5rem' }}
                      />
                    </FlexItem>
                    <FlexItem>
                      <Text>Source on GitHub</Text>
                    </FlexItem>
                  </a>
                </Flex>
              </FlexItem>
              <FlexItem>
                <Flex direction={{ default: 'row' }}>
                  <FlexItem style={{ alignmentBaseline: 'middle' }}>
                    {repoStars !== null && (
                      <img
                        src={starLogo}
                        alt="Star Logo"
                        style={{ height: '15px', marginRight: '0.5rem', verticalAlign: 'text-top' }}
                      />
                    )}
                    {repoStars !== null ? `${repoStars}` : ''}
                  </FlexItem>
                  <FlexItem>
                    {repoStars !== null && (
                      <img
                        src={forkLogo}
                        alt="Fork Logo"
                        style={{ height: '15px', marginRight: '0.5rem', verticalAlign: 'text-top' }}
                      />
                    )}
                    {repoForks !== null ? `${repoForks}` : ''}
                  </FlexItem>
                </Flex>
              </FlexItem>
            </Flex>
          </Text>
        </div>
      </PageSidebarBody>
    </PageSidebar>
  );
};

export default NavSidebar;
