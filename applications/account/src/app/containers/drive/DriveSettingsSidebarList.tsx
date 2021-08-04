import { c } from 'ttag';
import { useRouteMatch } from 'react-router-dom';

import { SidebarList, SidebarListItem, SidebarListItemContent } from '@proton/components';
import { APPS, APPS_CONFIGURATION } from '@proton/shared/lib/constants';

import SettingsListItem from '../../components/SettingsListItem';

const DriveSettingsSidebarList = () => {
    const { path } = useRouteMatch();

    return (
        <SidebarList>
            <SidebarListItem className="text-uppercase text-left navigation-link-header-group">
                <SidebarListItemContent>{APPS_CONFIGURATION[APPS.PROTONDRIVE].name}</SidebarListItemContent>
            </SidebarListItem>
            <SettingsListItem to={`${path}/general`} icon="apps">
                {c('Settings section title').t`General`}
            </SettingsListItem>
        </SidebarList>
    );
};

export default DriveSettingsSidebarList;
