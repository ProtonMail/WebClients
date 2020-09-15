import React from 'react';
import { c } from 'ttag';
import { Location } from 'history';
import { Sidebar, SidebarPrimaryButton, SidebarNav, MainLogo } from 'react-components';

import { MESSAGE_ACTIONS } from '../../constants';
import MailSidebarList from './MailSidebarList';
import SidebarVersion from './SidebarVersion';
import { OnCompose } from '../../hooks/useCompose';

interface Props {
    labelID: string;
    expanded?: boolean;
    location: Location;
    onToggleExpand: () => void;
    onCompose: OnCompose;
}

const MailSidebar = ({ labelID, expanded = false, location, onToggleExpand, onCompose }: Props) => {
    const handleCompose = () => {
        onCompose({ action: MESSAGE_ACTIONS.NEW });
    };
    return (
        <Sidebar
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            primary={
                <SidebarPrimaryButton onClick={handleCompose} data-test-id="sidebar:compose">
                    {c('Action').t`New message`}
                </SidebarPrimaryButton>
            }
            logo={<MainLogo to="/inbox" />}
            version={<SidebarVersion />}
        >
            <SidebarNav>
                <MailSidebarList labelID={labelID} location={location} />
            </SidebarNav>
        </Sidebar>
    );
};

export default MailSidebar;
