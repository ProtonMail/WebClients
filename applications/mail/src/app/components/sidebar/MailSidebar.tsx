import React, { useCallback, memo } from 'react';
import { c } from 'ttag';
import { Location } from 'history';
import { Sidebar, SidebarPrimaryButton, SidebarNav, MainLogo, useMailSettings, Tooltip } from 'react-components';

import { MESSAGE_ACTIONS } from '../../constants';
import MailSidebarList from './MailSidebarList';
import SidebarVersion from './SidebarVersion';
import { OnCompose } from '../../hooks/composer/useCompose';

interface Props {
    labelID: string;
    expanded?: boolean;
    location: Location;
    onToggleExpand: () => void;
    onCompose: OnCompose;
}

const MailSidebar = ({ labelID, expanded = false, location, onToggleExpand, onCompose }: Props) => {
    const handleCompose = useCallback(() => {
        onCompose({ action: MESSAGE_ACTIONS.NEW });
    }, [onCompose]);
    const [{ Shortcuts } = { Shortcuts: 0 }] = useMailSettings();

    const titlePrimaryButton = Shortcuts ? (
        <>
            {c('Title').t`New message`}
            <br />
            <kbd className="bg-global-altgrey noborder">N</kbd>
        </>
    ) : null;
    const sideBarPrimaryButton = Shortcuts ? (
        <Tooltip title={titlePrimaryButton} originalPlacement="top">
            <SidebarPrimaryButton className="nomobile" onClick={handleCompose} data-test-id="sidebar:compose">
                {c('Action').t`New message`}
            </SidebarPrimaryButton>
        </Tooltip>
    ) : (
        <SidebarPrimaryButton className="nomobile" onClick={handleCompose} data-test-id="sidebar:compose">
            {c('Action').t`New message`}
        </SidebarPrimaryButton>
    );
    return (
        <Sidebar
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            primary={sideBarPrimaryButton}
            logo={<MainLogo to="/inbox" />}
            version={<SidebarVersion />}
        >
            <SidebarNav>
                <MailSidebarList labelID={labelID} location={location} />
            </SidebarNav>
        </Sidebar>
    );
};

export default memo(MailSidebar);
