import React from 'react';
import { c } from 'ttag';
import { useRouteMatch } from 'react-router-dom';
import { SidebarList, SidebarListItem, SidebarListItemContent, useOrganization } from 'react-components';
import { APPS, APPS_CONFIGURATION } from 'proton-shared/lib/constants';

import SettingsListItem from '../../components/SettingsListItem';

const { PROTONMAIL } = APPS;

const MailSettingsSidebarList = () => {
    const { path } = useRouteMatch();
    const [organization] = useOrganization();
    const hasOrganization = organization?.HasKeys;

    return (
        <SidebarList>
            <SidebarListItem className="text-uppercase text-left navigation-link-header-group">
                <SidebarListItemContent>{APPS_CONFIGURATION[PROTONMAIL].name}</SidebarListItemContent>
            </SidebarListItem>
            <SettingsListItem to={`${path}/general`} icon="apps">
                {c('Settings section title').t`General`}
            </SettingsListItem>
            <SettingsListItem to={`${path}/identity-addresses`} icon="identity">
                {c('Settings section title').t`Identity & addresses`}
            </SettingsListItem>
            <SettingsListItem to={`${path}/appearance`} icon="apparence">
                {c('Settings section title').t`Appearance`}
            </SettingsListItem>
            <SettingsListItem to={`${path}/folders-labels`} icon="folder-label">
                {c('Settings section title').t`Folders & labels`}
            </SettingsListItem>
            <SettingsListItem to={`${path}/filters`} icon="filter">
                {c('Settings section title').t`Filters`}
            </SettingsListItem>
            <SettingsListItem to={`${path}/auto-reply`} icon="auto-reply2">
                {c('Settings section title').t`Auto reply`}
            </SettingsListItem>
            {!hasOrganization ? (
                <SettingsListItem to={`${path}/domain-names`} icon="globe">
                    {c('Settings section title').t`Domain Names`}
                </SettingsListItem>
            ) : null}
            <SettingsListItem to={`${path}/encryption-keys`} icon="security">
                {c('Settings section title').t`Encryption & keys`}
            </SettingsListItem>
            <SettingsListItem to={`${path}/import-export`} icon="export">
                {c('Settings section title').t`Import & export`}
            </SettingsListItem>
            <SettingsListItem to={`${path}/imap-smtp`} icon="imap-smtp">
                {c('Settings section title').t`IMAP/SMTP`}
            </SettingsListItem>
        </SidebarList>
    );
};

export default MailSettingsSidebarList;
