import { ReactNode } from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import {
    AddressKeysSection,
    AddressVerificationSection,
    AddressesSection,
    AliasPromotionSection,
    AutoReplySection,
    CatchAllSection,
    DomainsSection,
    EmailPrivacySection,
    ExternalPGPSettingsSection,
    FiltersSection,
    FoldersSection,
    IdentitySection,
    ImportExportAppSection,
    LabelsSection,
    LayoutsSection,
    MessagesGeneralSection,
    MessagesOtherSection,
    MessagesSection,
    OtherMailPreferencesSection,
    PmMeSection,
    PrivateMainAreaLoading,
    PrivateMainSettingsArea,
    ProtonMailBridgeSection,
    SMTPSubmissionSection,
    SpamFiltersSection,
    UserKeysSection,
    useAddresses,
} from '@proton/components';
import ForwardSection from '@proton/components/containers/forward/ForwardSection';
import { getIsSectionAvailable, getSectionPath } from '@proton/components/containers/layout/helper';

import type { getMailAppRoutes } from './routes';
import { getHasPmMeAddress } from './routes';

const MailSettingsRouter = ({
    mailAppRoutes,
    redirect,
}: {
    mailAppRoutes: ReturnType<typeof getMailAppRoutes>;
    redirect: ReactNode;
}) => {
    const { path } = useRouteMatch();
    const [addresses, loadingAddresses] = useAddresses();

    const {
        routes: { general, identity, folder, filter, autoReply, domainNames, keys, imap, backup, privacy },
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
                        <LayoutsSection />
                        <MessagesSection />
                        <MessagesOtherSection />
                        <OtherMailPreferencesSection />
                    </PrivateMainSettingsArea>
                )}
            </Route>
            <Route path={getSectionPath(path, identity)}>
                <PrivateMainSettingsArea config={identity}>
                    <IdentitySection />
                    <AliasPromotionSection />
                    <AddressesSection isOnlySelf />
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
                    <ForwardSection />
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
                    <SMTPSubmissionSection />
                </PrivateMainSettingsArea>
            </Route>
            <Route path={`${path}/invitation/view`}>
                <Redirect to={`${path}/dashboard`} />
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
