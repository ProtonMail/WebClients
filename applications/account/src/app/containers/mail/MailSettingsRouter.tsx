import { ReactNode } from 'react';
import { Route, Redirect, Switch, useRouteMatch } from 'react-router-dom';

import {
    useAddresses,
    ThemesSection,
    LayoutsSection,
    MessagesOtherSection,
    IdentitySection,
    AddressesSection,
    PmMeSection,
    MessagesSection,
    MessagesGeneralSection,
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
    NewDomainSection,
} from '@proton/components';
import { getIsSectionAvailable, getSectionPath } from '@proton/components/containers/layout/helper';

import { getHasPmMeAddress, getMailAppRoutes } from './routes';
import PrivateMainAreaLoading from '../../components/PrivateMainAreaLoading';

const MailSettingsRouter = ({
    mailAppRoutes,
    redirect,
    newDomain,
    setNewDomain,
}: {
    mailAppRoutes: ReturnType<typeof getMailAppRoutes>;
    redirect: ReactNode;
    newDomain: string;
    setNewDomain: (value: string) => void;
}) => {
    const { path } = useRouteMatch();
    const [addresses, loadingAddresses] = useAddresses();

    const {
        routes: { general, identity, appearance, folder, filter, autoReply, domainNames, keys, imap, backup, privacy },
    } = mailAppRoutes;

    return (
        <Switch>
            <Route path={getSectionPath(path, general)}>
                {loadingAddresses && !Array.isArray(addresses) ? (
                    <PrivateMainAreaLoading />
                ) : (
                    <PrivateMainSettingsArea config={general}>
                        <PmMeSection isPMAddressActive={getHasPmMeAddress(addresses)} />
                        <MessagesGeneralSection />
                        <MessagesSection />
                        <MessagesOtherSection />
                    </PrivateMainSettingsArea>
                )}
            </Route>
            <Route path={getSectionPath(path, identity)}>
                <PrivateMainSettingsArea config={identity}>
                    <NewDomainSection domain={newDomain} onDone={() => setNewDomain('')} />
                    <IdentitySection />
                    <AddressesSection isOnlySelf />
                </PrivateMainSettingsArea>
            </Route>
            <Route path={getSectionPath(path, appearance)}>
                <PrivateMainSettingsArea config={appearance}>
                    <ThemesSection />
                    <LayoutsSection />
                </PrivateMainSettingsArea>
            </Route>
            <Route path={getSectionPath(path, folder)}>
                <PrivateMainSettingsArea config={folder}>
                    <FoldersSection />
                    <LabelsSection />
                </PrivateMainSettingsArea>
            </Route>
            <Route path={getSectionPath(path, filter)}>
                <PrivateMainSettingsArea config={filter}>
                    <FiltersSection />
                    <SpamFiltersSection />
                </PrivateMainSettingsArea>
            </Route>
            <Route path={getSectionPath(path, autoReply)}>
                <PrivateMainSettingsArea config={autoReply}>
                    <AutoReplySection />
                </PrivateMainSettingsArea>
            </Route>
            {getIsSectionAvailable(domainNames) && (
                <Route path={getSectionPath(path, domainNames)}>
                    <PrivateMainSettingsArea config={domainNames}>
                        <DomainsSection />
                        <CatchAllSection />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            <Route path={getSectionPath(path, keys)}>
                <PrivateMainSettingsArea config={keys}>
                    <AddressVerificationSection />
                    <ExternalPGPSettingsSection />
                    <AddressKeysSection />
                    <UserKeysSection />
                </PrivateMainSettingsArea>
            </Route>
            <Route path={getSectionPath(path, imap)}>
                <PrivateMainSettingsArea config={imap}>
                    <ProtonMailBridgeSection />
                </PrivateMainSettingsArea>
            </Route>
            <Route path={`${path}/import-export`}>
                <Redirect to={`${path}/easy-switch`} />
            </Route>
            {getIsSectionAvailable(backup) && (
                <Route path={getSectionPath(path, backup)}>
                    <PrivateMainSettingsArea config={backup}>
                        <ImportExportAppSection key="import-export-app" />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {getIsSectionAvailable(privacy) && (
                <Route path={getSectionPath(path, privacy)}>
                    <PrivateMainSettingsArea config={privacy}>
                        <EmailPrivacySection />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {redirect}
        </Switch>
    );
};

export default MailSettingsRouter;
