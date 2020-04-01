import React from 'react';
import { c } from 'ttag';
import { Location } from 'history';
import { MainLogo, PrimaryButton, MobileAppsLinks } from 'react-components';

import { MESSAGE_ACTIONS } from '../../constants';
import { OnCompose } from '../../containers/ComposerContainer';
import SidebarMenu from './SidebarMenu';
import SidebarVersion from './SidebarVersion';

interface Props {
    labelID: string;
    expanded?: boolean;
    location: Location;
    onCompose: OnCompose;
}

const PrivateSidebar = ({ labelID, expanded = false, location, onCompose }: Props) => {
    const handleCompose = () => {
        onCompose({ action: MESSAGE_ACTIONS.NEW });
    };

    return (
        <div className="sidebar flex flex-column noprint" data-expanded={expanded}>
            <div className="nodesktop notablet">
                <MainLogo url="/inbox" />
            </div>
            <div className="pl1 pr1 mb1">
                <PrimaryButton className="w100 bold" onClick={handleCompose}>{c('Action').t`Compose`}</PrimaryButton>
            </div>
            <nav className="navigation mw100 flex-item-fluid customScrollBar-container scroll-if-needed">
                <SidebarMenu labelID={labelID} location={location} />
            </nav>
            <SidebarVersion />
            <MobileAppsLinks />
        </div>
    );
};

export default PrivateSidebar;
