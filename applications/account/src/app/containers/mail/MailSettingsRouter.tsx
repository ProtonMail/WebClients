import { ReactNode } from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import {
    AddressKeysSection,
    AddressVerificationSection,
    AddressesSection,
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
    PmMeSection,
    PrivateMainAreaLoading,
    PrivateMainSettingsArea,
    ProtonMailBridgeSection,
    SenderImagesSection,
    SpamFiltersSection,
    ThemesSection,
    UserKeysSection,
    useAddresses, useFeature, FeatureCode,
} from '@proton/components';
import { getIsSectionAvailable, getSectionPath } from '@proton/components/containers/layout/helper';

import { getHasPmMeAddress, getMailAppRoutes } from './routes';

const MailSettingsRouter = ({
    mailAppRoutes,
    redirect,
}: {
    mailAppRoutes: ReturnType<typeof getMailAppRoutes>;
    redirect: ReactNode;
}) => {
    const { feature: showSenderImagesFeature } = useFeature(FeatureCode.ShowSenderImages);
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
                    <IdentitySection />
                    <AddressesSection isOnlySelf />
                </PrivateMainSettingsArea>
            </Route>
            <Route path={getSectionPath(path, appearance)}>
                <PrivateMainSettingsArea config={appearance}>
                    <ThemesSection />
                    <LayoutsSection />
                    {showSenderImagesFeature?.Value && <SenderImagesSection />}
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
