import type { ReactNode } from 'react';
import { useRef } from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useLoadAllowedTimeZones } from '@proton/calendar/timezones';
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
    InboxDesktopSettingsSection,
    LabelsSection,
    LayoutsSection,
    MessagesGeneralSection,
    MessagesOtherSection,
    MessagesSection,
    MobileAppSettingsSection,
    OtherMailPreferencesSection,
    PmMeSection,
    PostQuantumKeysOptInSection,
    PrivateMainAreaLoading,
    PrivateMainSettingsArea,
    ProtonMailBridgeSection,
    SMTPSubmissionSection,
    SpamFiltersSection,
    UserKeysSection,
    useIsInboxElectronApp,
} from '@proton/components';
import ForwardSection from '@proton/components/containers/forward/ForwardSection';
import { getIsSectionAvailable, getSectionPath } from '@proton/components/containers/layout/helper';
import { useFolders } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';

import type { getMailAppRoutes } from './routes';
import { getHasPmMeAddress } from './routes';
import { CategoriesViewSections } from './sections/CategoriesViewSections';

const MailSettingsRouter = ({
    mailAppRoutes,
    redirect,
}: {
    mailAppRoutes: ReturnType<typeof getMailAppRoutes>;
    redirect: ReactNode;
}) => {
    const { path } = useRouteMatch();
    const [addresses, loadingAddresses] = useAddresses();
    const onceRef = useRef<boolean>(false);
    const { isElectronEnabled } = useIsInboxElectronApp();
    useLoadAllowedTimeZones();

    useMailSettings(); // Preload mail settings
    useFolders(); // Preload folders

    const {
        routes: { general, identity, folder, filter, autoReply, domainNames, keys, imap, desktop, backup, privacy },
    } = mailAppRoutes;

    return (
        <Switch>
            <Route path={getSectionPath(path, general)}>
                {loadingAddresses && !Array.isArray(addresses) ? (
                    <PrivateMainAreaLoading />
                ) : (
                    <PrivateMainSettingsArea config={general}>
                        <MessagesGeneralSection />
                        <CategoriesViewSections />
                        <LayoutsSection />
                        <MessagesSection />
                        <MessagesOtherSection />
                        <OtherMailPreferencesSection />
                    </PrivateMainSettingsArea>
                )}
            </Route>
            <Route path={getSectionPath(path, desktop)}>
                <PrivateMainSettingsArea config={desktop}>
                    <MobileAppSettingsSection />
                    {isElectronEnabled && <InboxDesktopSettingsSection />}
                </PrivateMainSettingsArea>
            </Route>
            <Route path={getSectionPath(path, identity)}>
                <PrivateMainSettingsArea config={identity}>
                    <PmMeSection isPMAddressActive={getHasPmMeAddress(addresses)} />
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
                        <DomainsSection onceRef={onceRef} />
                        <CatchAllSection />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            <Route path={getSectionPath(path, keys)}>
                <PrivateMainSettingsArea config={keys}>
                    <AddressVerificationSection />
                    <ExternalPGPSettingsSection />
                    <PostQuantumKeysOptInSection />
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
                <Redirect to={`${path}/dashboard#your-plan`} />
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
