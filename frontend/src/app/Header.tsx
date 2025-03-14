import React from 'react';
import {
  Brand,
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadMain,
  MastheadToggle,
  PageToggleButton,
  Switch,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core';
import { BarsIcon } from '@patternfly/react-icons';
import { Link } from 'react-router-dom';
import { ODH_LOGO, ODH_PRODUCT_NAME } from '~/utilities/const';
import { useUser } from '~/redux/selectors';
import { useMode } from '~/redux/selectors/mode';
import { useAppDispatch } from '~/redux/hooks';
import { switchEasyMode } from '~/redux/actions/actions';
import HeaderTools from './HeaderTools';

type HeaderProps = {
  onNotificationsClick: () => void;
};

const MastheadBranchComponent: React.FC<React.ComponentProps<typeof Link>> = (props) => (
  <Link {...props} to="/" />
);

const Header: React.FC<HeaderProps> = ({ onNotificationsClick }) => {
  const dispatch = useAppDispatch();
  const { isAllowed } = useUser();
  const { isEasyMode } = useMode();
  const handleEasyModeToggle = () => {
    dispatch(switchEasyMode());
  };
  return (
    <Masthead role="banner" aria-label="page masthead">
      {isAllowed && (
        <MastheadToggle>
          <PageToggleButton id="page-nav-toggle" variant="plain" aria-label="Dashboard navigation">
            <BarsIcon />
          </PageToggleButton>
        </MastheadToggle>
      )}
      <MastheadMain>
        <MastheadBrand component={MastheadBranchComponent}>
          <Brand
            className="odh-dashboard__brand"
            src={`${window.location.origin}/images/${ODH_LOGO}`}
            alt={`${ODH_PRODUCT_NAME} Logo`}
          />
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        <HeaderTools onNotificationsClick={onNotificationsClick} />
        <Switch
          id="easymode-switch"
          isChecked={isEasyMode}
          onChange={handleEasyModeToggle}
          ouiaId="EasyModeSwitch"
          className="padding-left-10"
        />
      </MastheadContent>
    </Masthead>
  );
};

export default Header;
