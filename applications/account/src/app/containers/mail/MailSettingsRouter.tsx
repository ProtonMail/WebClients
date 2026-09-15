import type { ReactNode } from 'react';
import { useRef } from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import { useAddresses } from '@proton/account/addresses/hooks';
import AddressesSection from '@proton/components/containers/addresses/AddressesSection';
import AliasPromotionSection from '@proton/components/containers/addresses/AliasPromotionSection';
import IdentitySection from '@proton/components/containers/addresses/IdentitySection';
import { AutoReplySection } from '@proton/components/containers/autoReply/AutoReplySection';
import { ProtonMailBridgeSection } from '@proton/components/containers/bridge/ProtonMailBridgeSection';
import { InboxDesktopSettingsSection } from '@proton/components/containers/desktop/InboxDesktopSettingsSection';
import CatchAllSection from '@proton/components/containers/domains/CatchAllSection';
import DomainsSection from '@proton/components/containers/domains/DomainsSection';
import EmailPrivacySection from '@proton/components/containers/emailPrivacy/EmailPrivacySection';
import FiltersSection from '@proton/components/containers/filters/FiltersSection';
import SpamFiltersSection from '@proton/components/containers/filters/SpamFiltersSection';
import ForwardSection from '@proton/components/containers/forward/ForwardSection';
import PmMeSection from '@proton/components/containers/general/PmMeSection';
import ImportExportAppSection from '@proton/components/containers/importExportApp/ImportExportAppSection';
import AddressKeysSection from '@proton/components/containers/keys/AddressKeysSection';
import PostQuantumKeysOptInSection from '@proton/components/containers/keys/PostQuantumKeysOptInSection/PostQuantumKeysOptInSection';
import UserKeysSection from '@proton/components/containers/keys/UserKeysSection';
import FoldersSection from '@proton/components/containers/labels/FoldersSection';
import LabelsSection from '@proton/components/containers/labels/LabelsSection';
import PrivateMainAreaLoading from '@proton/components/containers/layout/PrivateMainAreaLoading';
import PrivateMainSettingsArea from '@proton/components/containers/layout/PrivateMainSettingsArea';
import { getIsSectionAvailable, getSectionPath } from '@proton/components/containers/layout/helper';
import LayoutsSection from '@proton/components/containers/layouts/LayoutsSection';
import MessagesOtherSection from '@proton/components/containers/layouts/MessagesOtherSection';
import MessagesGeneralSection from '@proton/components/containers/messages/MessagesGeneralSection';
import MessagesSection from '@proton/components/containers/messages/MessagesSection';
import MobileAppSettingsSection from '@proton/components/containers/mobile/MobileAppSettingsSection';
import { OtherMailPreferencesSection } from '@proton/components/containers/otherMailPreferences/OtherMailPreferencesSection';
import { AddressVerificationSection } from '@proton/components/containers/security/AddressVerificationSection';
import { ExternalPGPSettingsSection } from '@proton/components/containers/security/ExternalPGPSettingsSection';
import SMTPSubmissionSection from '@proton/components/containers/smtp/SMTPSubmissionSection';
import useIsInboxElectronApp from '@proton/components/hooks/useIsInboxElectronApp';
import { useLoadAllowedTimeZones } from '@proton/components/hooks/useLoadAllowedTimeZones';
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
