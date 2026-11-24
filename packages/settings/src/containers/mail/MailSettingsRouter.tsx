import type { MutableRefObject, ReactNode } from 'react';
import { useRef } from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useLoadAllowedTimeZones } from '@proton/calendar-settings/hooks/useLoadAllowedTimeZones';
import AliasPromotionSection from '@proton/components/containers/addresses/AliasPromotionSection';
import IdentitySection from '@proton/components/containers/addresses/IdentitySection';
import { ProtonMailBridgeSection } from '@proton/components/containers/bridge/ProtonMailBridgeSection';
import { InboxDesktopSettingsSection } from '@proton/components/containers/desktop/InboxDesktopSettingsSection';
import CatchAllSection from '@proton/components/containers/domains/CatchAllSection';
import DomainsSection, { useShowDomainsUpsell } from '@proton/components/containers/domains/DomainsSection';
import { SimpleEditorProvider } from '@proton/components/containers/editor/SimpleEditorContext';
import EmailPrivacySection from '@proton/components/containers/emailPrivacy/EmailPrivacySection';
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
import {
    type SettingsAreaConfig,
    SettingsCardMaxWidth,
    SettingsLayoutVariant,
} from '@proton/components/containers/layout/interface';
import LayoutsSection from '@proton/components/containers/layouts/LayoutsSection';
import MessagesOtherSection from '@proton/components/containers/layouts/MessagesOtherSection';
import MessagesSection from '@proton/components/containers/messages/MessagesSection';
import MobileAppSettingsSection from '@proton/components/containers/mobile/MobileAppSettingsSection';
import { OtherMailPreferencesSection } from '@proton/components/containers/otherMailPreferences/OtherMailPreferencesSection';
import { AddressVerificationSection } from '@proton/components/containers/security/AddressVerificationSection';
import { ExternalPGPSettingsSection } from '@proton/components/containers/security/ExternalPGPSettingsSection';
import SMTPSubmissionSection, {
    useShowSmtpSubmissionUpsell,
} from '@proton/components/containers/smtp/SMTPSubmissionSection';
import useIsInboxElectronApp from '@proton/components/hooks/useIsInboxElectronApp';
import SimpleEditor from '@proton/mail-composer/components/editor/SimpleEditor';
import { AutoReplySection } from '@proton/mail-settings/autoReply/AutoReplySection';
import FiltersSection from '@proton/mail-settings/filters/FiltersSection';
import SpamFiltersSection from '@proton/mail-settings/filters/SpamFiltersSection';
import ForwardSection from '@proton/mail-settings/forward/ForwardSection';
import { useFolders } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';

import AddressesSection from '../addresses/AddressesSection';
import MessagesGeneralSection from './MessagesGeneralSection';
import type { getMailAppRoutes } from './routes';
import { getHasPmMeAddress } from './routes';
import { CategoriesViewSections } from './sections/CategoriesViewSections';

// The next two pages use the narrow width while they only show upgrade banners, and the
// wider one once they show content. While loading, they keep the wider width.

const DomainNamesSettings = ({
    config,
    onceRef,
}: {
    config: SettingsAreaConfig;
    onceRef: MutableRefObject<boolean>;
}) => {
    const showUpsell = useShowDomainsUpsell();
    return (
        <PrivateMainSettingsArea
            config={config}
            variant={SettingsLayoutVariant.Card}
            maxWidth={showUpsell ? SettingsCardMaxWidth.Narrow : SettingsCardMaxWidth.Medium}
        >
            <DomainsSection onceRef={onceRef} variant={SettingsLayoutVariant.Card} />
            <CatchAllSection variant={SettingsLayoutVariant.Card} />
        </PrivateMainSettingsArea>
    );
};

const ImapSmtpSettings = ({ config }: { config: SettingsAreaConfig }) => {
    const [user] = useUser();
    const showSmtpSubmissionUpsell = useShowSmtpSubmissionUpsell();
    // Bridge shows its upgrade banner without paid Mail
    const showUpsellOnly = !user.hasPaidMail && showSmtpSubmissionUpsell === true;
    return (
        <PrivateMainSettingsArea
            config={config}
            variant={SettingsLayoutVariant.Card}
            maxWidth={showUpsellOnly ? SettingsCardMaxWidth.Narrow : SettingsCardMaxWidth.Medium}
        >
            <ProtonMailBridgeSection />
            <SMTPSubmissionSection />
        </PrivateMainSettingsArea>
    );
};

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
        <SimpleEditorProvider editor={SimpleEditor}>
            <Switch>
                <Route path={getSectionPath(path, general)}>
                    {loadingAddresses && !Array.isArray(addresses) ? (
                        <PrivateMainAreaLoading />
                    ) : (
                        <PrivateMainSettingsArea
                            config={general}
                            variant={SettingsLayoutVariant.Card}
                            maxWidth={SettingsCardMaxWidth.Narrow}
                        >
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
                    <PrivateMainSettingsArea
                        config={desktop}
                        variant={SettingsLayoutVariant.Card}
                        maxWidth={SettingsCardMaxWidth.Medium}
                    >
                        <MobileAppSettingsSection />
                        {isElectronEnabled && <InboxDesktopSettingsSection />}
                    </PrivateMainSettingsArea>
                </Route>
                <Route path={getSectionPath(path, identity)}>
                    <PrivateMainSettingsArea
                        config={identity}
                        variant={SettingsLayoutVariant.Card}
                        maxWidth={SettingsCardMaxWidth.Narrow}
                    >
                        <PmMeSection isPMAddressActive={getHasPmMeAddress(addresses)} />
                        <IdentitySection />
                        <AliasPromotionSection />
                        <AddressesSection isOnlySelf />
                    </PrivateMainSettingsArea>
                </Route>
                <Route path={getSectionPath(path, folder)}>
                    <PrivateMainSettingsArea
                        config={folder}
                        variant={SettingsLayoutVariant.Card}
                        maxWidth={SettingsCardMaxWidth.Narrow}
                    >
                        <FoldersSection variant={SettingsLayoutVariant.Card} />
                        <LabelsSection variant={SettingsLayoutVariant.Card} />
                    </PrivateMainSettingsArea>
                </Route>
                <Route path={getSectionPath(path, filter)}>
                    <PrivateMainSettingsArea
                        config={filter}
                        variant={SettingsLayoutVariant.Card}
                        maxWidth={SettingsCardMaxWidth.Narrow}
                    >
                        <FiltersSection />
                        <SpamFiltersSection variant={SettingsLayoutVariant.Card} />
                    </PrivateMainSettingsArea>
                </Route>
                <Route path={getSectionPath(path, autoReply)}>
                    <PrivateMainSettingsArea
                        config={autoReply}
                        variant={SettingsLayoutVariant.Card}
                        maxWidth={SettingsCardMaxWidth.Narrow}
                    >
                        <ForwardSection />
                        <AutoReplySection />
                    </PrivateMainSettingsArea>
                </Route>
                {getIsSectionAvailable(domainNames) && (
                    <Route path={getSectionPath(path, domainNames)}>
                        <DomainNamesSettings config={domainNames} onceRef={onceRef} />
                    </Route>
                )}
                <Route path={getSectionPath(path, keys)}>
                    <PrivateMainSettingsArea
                        config={keys}
                        variant={SettingsLayoutVariant.Card}
                        maxWidth={SettingsCardMaxWidth.Medium}
                    >
                        <AddressVerificationSection />
                        <ExternalPGPSettingsSection />
                        <PostQuantumKeysOptInSection />
                        <AddressKeysSection />
                        <UserKeysSection />
                    </PrivateMainSettingsArea>
                </Route>
                <Route path={getSectionPath(path, imap)}>
                    <ImapSmtpSettings config={imap} />
                </Route>
                <Route path={`${path}/invitation/view`}>
                    <Redirect to={`${path}/dashboard#your-plan`} />
                </Route>
                <Route path={`${path}/import-export`}>
                    <Redirect to={`${path}/easy-switch`} />
                </Route>
                {getIsSectionAvailable(backup) && (
                    <Route path={getSectionPath(path, backup)}>
                        <PrivateMainSettingsArea
                            config={backup}
                            variant={SettingsLayoutVariant.Card}
                            maxWidth={SettingsCardMaxWidth.Medium}
                        >
                            <ImportExportAppSection key="import-export-app" />
                        </PrivateMainSettingsArea>
                    </Route>
                )}
                {getIsSectionAvailable(privacy) && (
                    <Route path={getSectionPath(path, privacy)}>
                        <PrivateMainSettingsArea
                            config={privacy}
                            variant={SettingsLayoutVariant.Card}
                            maxWidth={SettingsCardMaxWidth.Narrow}
                        >
                            <EmailPrivacySection />
                        </PrivateMainSettingsArea>
                    </Route>
                )}
                {redirect}
            </Switch>
        </SimpleEditorProvider>
    );
};

export default MailSettingsRouter;
