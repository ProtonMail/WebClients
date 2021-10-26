import { c } from 'ttag';
import { useRouteMatch } from 'react-router-dom';
import {
    FeatureCode,
    SidebarList,
    SidebarListItem,
    SidebarListItemContent,
    useFeature,
    useOrganization,
    useUser,
} from '@proton/components';
import { APPS, APPS_CONFIGURATION } from '@proton/shared/lib/constants';

import SettingsListItem from '../../components/SettingsListItem';

const { PROTONMAIL } = APPS;

const MailSettingsSidebarList = () => {
    const { path } = useRouteMatch();
    const [user] = useUser();
    const [organization] = useOrganization();
    const hasOrganization = organization?.HasKeys;
    const { feature: spyTrackerFeature } = useFeature(FeatureCode.SpyTrackerProtection);

    const isEasySwitchEnabled = useFeature(FeatureCode.EasySwitch).feature?.Value;

    const easySwitchSidebarListItem = !user.isFree ? (
        <SettingsListItem to={`${path}/import-export`} icon="arrow-up-from-screen">
            {c('Settings section title').t`Backup & Export`}
        </SettingsListItem>
    ) : null;

    return (
        <SidebarList>
            <SidebarListItem className="text-uppercase text-left navigation-link-header-group">
                <SidebarListItemContent>{APPS_CONFIGURATION[PROTONMAIL].name}</SidebarListItemContent>
            </SidebarListItem>
            <SettingsListItem to={`${path}/general`} icon="grid">
                {c('Settings section title').t`General`}
            </SettingsListItem>
            {spyTrackerFeature?.Value && (
                <SettingsListItem to={`${path}/email-privacy`} icon="shield">
                    {c('Settings section title').t`Email privacy`}
                </SettingsListItem>
            )}
            <SettingsListItem to={`${path}/identity-addresses`} icon="address-card">
                {c('Settings section title').t`Identity & addresses`}
            </SettingsListItem>
            <SettingsListItem to={`${path}/appearance`} icon="paint-roller">
                {c('Settings section title').t`Appearance`}
            </SettingsListItem>
            <SettingsListItem to={`${path}/folders-labels`} icon="tags">
                {c('Settings section title').t`Folders & labels`}
            </SettingsListItem>
            <SettingsListItem to={`${path}/filters`} icon="filter">
                {c('Settings section title').t`Filters`}
            </SettingsListItem>
            <SettingsListItem to={`${path}/auto-reply`} icon="envelope-fast">
                {c('Settings section title').t`Auto reply`}
            </SettingsListItem>
            {!hasOrganization ? (
                <SettingsListItem to={`${path}/domain-names`} icon="globe">
                    {c('Settings section title').t`Domain Names`}
                </SettingsListItem>
            ) : null}
            <SettingsListItem to={`${path}/encryption-keys`} icon="lock-filled">
                {c('Settings section title').t`Encryption & keys`}
            </SettingsListItem>
            <SettingsListItem to={`${path}/imap-smtp`} icon="servers">
                {c('Settings section title').t`IMAP/SMTP`}
            </SettingsListItem>
            {isEasySwitchEnabled ? (
                easySwitchSidebarListItem
            ) : (
                <SettingsListItem to={`${path}/import-export`} icon="arrow-up-from-screen">
                    {user.isFree ? c('Title').t`Import Assistant` : c('Settings section title').t`Import & export`}
                </SettingsListItem>
            )}
        </SidebarList>
    );
};

export default MailSettingsSidebarList;
