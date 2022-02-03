import { ReactNode } from 'react';
import { Route, Redirect, Switch, useRouteMatch, useLocation } from 'react-router-dom';

import {
    useAddresses,
    ThemesSection,
    LayoutsSection,
    AppearanceOtherSection,
    IdentitySection,
    AddressesSection,
    PmMeSection,
    MessagesSection,
    FoldersSection,
    LabelsSection,
    FiltersSection,
    SpamFiltersSection,
    AutoReplySection,
    DomainsSection,
    CatchAllSection,
    AddressVerificationSection,
    ExternalPGPSettingsSection,
    AddressKeysSection,
    UserKeysSection,
    ProtonMailBridgeSection,
    EmailPrivacySection,
    ImportExportAppSection,
    PrivateMainSettingsArea,
} from '@proton/components';
import { getIsSectionAvailable, getSectionPath } from '@proton/components/containers/layout/helper';

import { getHasPmMeAddress, getMailAppRoutes } from './routes';
import PrivateMainAreaLoading from '../../components/PrivateMainAreaLoading';

const MailSettingsRouter = ({
    mailAppRoutes,
    redirect,
}: {
    mailAppRoutes: ReturnType<typeof getMailAppRoutes>;
    redirect: ReactNode;
}) => {
    const { path } = useRouteMatch();
    const [addresses, loadingAddresses] = useAddresses();
    const location = useLocation();

    const {
        routes: { general, identity, appearance, folder, filter, autoReply, domainNames, keys, imap, backup, privacy },
    } = mailAppRoutes;

    return (
        <Switch>
            <Route path={getSectionPath(path, general)}>
                {loadingAddresses && !Array.isArray(addresses) ? (
                    <PrivateMainAreaLoading />
                ) : (
                    <PrivateMainSettingsArea location={location} config={general}>
                        <PmMeSection isPMAddressActive={getHasPmMeAddress(addresses)} />
                        <MessagesSection />
                    </PrivateMainSettingsArea>
                )}
            </Route>
            <Route path={getSectionPath(path, identity)}>
                <PrivateMainSettingsArea location={location} config={identity}>
                    <IdentitySection />
                    <AddressesSection isOnlySelf />
                </PrivateMainSettingsArea>
            </Route>
            <Route path={getSectionPath(path, appearance)}>
                <PrivateMainSettingsArea location={location} config={appearance}>
                    <ThemesSection />
                    <LayoutsSection />
                    <AppearanceOtherSection />
                </PrivateMainSettingsArea>
            </Route>
            <Route path={getSectionPath(path, folder)}>
                <PrivateMainSettingsArea location={location} config={folder}>
                    <FoldersSection />
                    <LabelsSection />
                </PrivateMainSettingsArea>
            </Route>
            <Route path={getSectionPath(path, filter)}>
                <PrivateMainSettingsArea location={location} config={filter}>
                    <FiltersSection />
                    <SpamFiltersSection />
                </PrivateMainSettingsArea>
            </Route>
            <Route path={getSectionPath(path, autoReply)}>
                <PrivateMainSettingsArea location={location} config={autoReply}>
                    <AutoReplySection />
                </PrivateMainSettingsArea>
            </Route>
            {getIsSectionAvailable(domainNames) && (
                <Route path={getSectionPath(path, domainNames)}>
                    <PrivateMainSettingsArea location={location} config={domainNames}>
                        <DomainsSection />
                        <CatchAllSection />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            <Route path={getSectionPath(path, keys)}>
                <PrivateMainSettingsArea location={location} config={keys}>
                    <AddressVerificationSection />
                    <ExternalPGPSettingsSection />
                    <AddressKeysSection />
                    <UserKeysSection />
                </PrivateMainSettingsArea>
            </Route>
            <Route path={getSectionPath(path, imap)}>
                <PrivateMainSettingsArea location={location} config={imap}>
                    <ProtonMailBridgeSection />
                </PrivateMainSettingsArea>
            </Route>
            <Route path={`${path}/import-export`}>
                <Redirect to={`${path}/easy-switch`} />
            </Route>
            {getIsSectionAvailable(backup) && (
                <Route path={getSectionPath(path, backup)}>
                    <PrivateMainSettingsArea location={location} config={backup}>
                        <ImportExportAppSection key="import-export-app" />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {getIsSectionAvailable(privacy) && (
                <Route path={getSectionPath(path, privacy)}>
                    <PrivateMainSettingsArea location={location} config={privacy}>
                        <EmailPrivacySection />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {redirect}
        </Switch>
    );
};

export default MailSettingsRouter;
