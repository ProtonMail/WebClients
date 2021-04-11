import React from 'react';
import { Route, Redirect, Switch, useRouteMatch, useLocation } from 'react-router-dom';

import { useOrganization, useUser } from 'react-components';

import MailAppearanceSettings from './MailAppearanceSettings';
import MailAutoReplySettings from './MailAutoReplySettings';
import MailDomainNamesSettings from './MailDomainNamesSettings';
import MailEncryptionKeysSettings from './MailEncryptionKeysSettings';
import MailFiltersSettings from './MailFiltersSettings';
import MailFoldersAndLabelsSettings from './MailFoldersAndLabelsSettings';
import MailGeneralSettings from './MailGeneralSettings';
import MailIdentityAndAddressesSettings from './MailIdentityAndAddressesSettings';
import MailImapSmtpSettings from './MailImapSmtpSettings';
import MailImportAndExportSettings from './MailImportAndExportSettings';

interface Props {
    onChangeBlurred: (isBlurred: boolean) => void;
}

const MailSettingsRouter = ({ onChangeBlurred }: Props) => {
    const { path } = useRouteMatch();
    const [user] = useUser();
    const location = useLocation();
    const [organization] = useOrganization();
    const hasOrganization = organization?.HasKeys;

    return (
        <Switch>
            <Route path={`${path}/general`}>
                <MailGeneralSettings user={user} location={location} />
            </Route>
            <Route path={`${path}/identity-addresses`}>
                <MailIdentityAndAddressesSettings location={location} />
            </Route>
            <Route path={`${path}/appearance`}>
                <MailAppearanceSettings location={location} />
            </Route>
            <Route path={`${path}/folders-labels`}>
                <MailFoldersAndLabelsSettings location={location} />
            </Route>
            <Route path={`${path}/filters`}>
                <MailFiltersSettings location={location} />
            </Route>
            <Route path={`${path}/auto-reply`}>
                <MailAutoReplySettings location={location} />
            </Route>
            {!hasOrganization ? (
                <Route path={`${path}/domain-names`}>
                    <MailDomainNamesSettings location={location} />
                </Route>
            ) : null}
            <Route path={`${path}/encryption-keys`}>
                <MailEncryptionKeysSettings location={location} />
            </Route>
            <Route path={`${path}/import-export`}>
                <MailImportAndExportSettings onChangeBlurred={onChangeBlurred} location={location} />
            </Route>
            <Route path={`${path}/imap-smtp`}>
                <MailImapSmtpSettings location={location} />
            </Route>
            <Redirect to={`${path}/general`} />
        </Switch>
    );
};

export default MailSettingsRouter;
