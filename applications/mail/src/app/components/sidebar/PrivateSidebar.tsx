import React from 'react';
import { c } from 'ttag';
import { Location } from 'history';
import { MainLogo, PrimaryButton, MobileAppsLinks, Hamburger } from 'react-components';

import { MESSAGE_ACTIONS } from '../../constants';
import { OnCompose } from '../../containers/ComposerContainer';
import SidebarMenu from './SidebarMenu';
import SidebarVersion from './SidebarVersion';
import { Breakpoints } from '../../models/utils';

interface Props {
    labelID: string;
    expanded?: boolean;
    location: Location;
    breakpoints: Breakpoints;
    onToggleExpand: () => void;
    onCompose: OnCompose;
}

const PrivateSidebar = ({ labelID, expanded = false, location, breakpoints, onToggleExpand, onCompose }: Props) => {
    const handleCompose = () => {
        onCompose({ action: MESSAGE_ACTIONS.NEW });
    };

    return (
        <div className="sidebar flex flex-column noprint" data-expanded={expanded}>
            <div className="nodesktop notablet flex-item-noshrink">
                <div className="flex flex-spacebetween flex-items-center">
                    <MainLogo url="/inbox" />
                    <Hamburger expanded={expanded} onToggle={onToggleExpand} />
                </div>
            </div>
            {!breakpoints.isNarrow && (
                <div className="pl1 pr1 mb1">
                    <PrimaryButton className="w100 bold" onClick={handleCompose}>{c('Action')
                        .t`Compose`}</PrimaryButton>
                </div>
            )}
            <nav className="navigation mw100 flex-item-fluid customScrollBar-container scroll-if-needed">
                <SidebarMenu labelID={labelID} location={location} />
            </nav>
            <SidebarVersion />
            <MobileAppsLinks />
        </div>
    );
};

export default PrivateSidebar;
