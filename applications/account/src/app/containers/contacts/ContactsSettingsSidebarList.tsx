import { c } from 'ttag';
import { useRouteMatch } from 'react-router-dom';

import { SidebarList, SidebarListItem, SidebarListItemContent } from '@proton/components';
import { APPS, APPS_CONFIGURATION } from '@proton/shared/lib/constants';

import SettingsListItem from '../../components/SettingsListItem';

const { PROTONCONTACTS } = APPS;

const ContactsSettingsSidebarList = () => {
    const { path } = useRouteMatch();

    return (
        <SidebarList>
            <SidebarListItem className="text-uppercase text-left navigation-link-header-group">
                <SidebarListItemContent>{APPS_CONFIGURATION[PROTONCONTACTS].name}</SidebarListItemContent>
            </SidebarListItem>
            <SettingsListItem to={`${path}/general`} icon="apps">
                {c('Settings section title').t`General`}
            </SettingsListItem>
            <SettingsListItem to={`${path}/import-export`} icon="export">
                {c('Settings section title').t`Import & export`}
            </SettingsListItem>
        </SidebarList>
    );
};

export default ContactsSettingsSidebarList;
