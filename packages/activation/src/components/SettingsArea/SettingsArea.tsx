import { type ReactNode, useEffect, useState } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import type { ProtonDriveClient } from '@protontech/drive-sdk';

import { useUser } from '@proton/account/user/hooks';
import useBYOEFeatureStatus from '@proton/byoe/src/hooks/useBYOEFeatureStatus';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import PrivateMainSettingsArea from '@proton/components/containers/layout/PrivateMainSettingsArea';
import type { SettingsAreaConfig } from '@proton/components/containers/layout/interface';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import { getIsBYOEAccount } from '@proton/shared/lib/keys/accountType';
import { useFlag } from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

import { EASY_SWITCH_SOURCES } from '../../interface';
import EasySwitchStoreInitializer from '../../logic/EasySwitchStoreInitializer';
import EasySwitchStoreProvider from '../../logic/StoreProvider';
import OLESSettingsArea from '../../oles/components/SettingsArea';
import { ImporterOrganizationsProvider } from '../../oles/useImporterOrganizations';
import useOLESFeatureStatus from '../../oles/useOLESFeatureStatus';
import DriveConnectEntry from '../Modals/OAuth/Drive/DriveConnectEntry';
import { DriveImportOutcomeModal } from '../Modals/OAuth/Drive/DriveImportOutcomeModal';
import { driveOAuthViewsOverride } from '../Modals/OAuth/Drive/driveOAuthViews';
import { useIsDriveImportRestricted } from '../Modals/OAuth/Drive/useIsDriveImportRestricted';
import ImportsTable from '../ReportsTable/ImportsTable';
import { SyncsTable } from '../ReportsTable/SyncsTable';
import ByoeReminderToggle from './ByoeReminderToggle';
import ProviderCard from './ProviderCards/ProviderCard';

import './EasySwitchTables.scss';

interface Props {
    config: SettingsAreaConfig;
    app: APP_NAMES;
}

const SettingsArea = ({ config, app }: Props) => {
    const [hasAccessToBYOE] = useBYOEFeatureStatus();
    const [user] = useUser();
    const showByoeReminder = useFlag('InboxByoeNewMessageReminderClient') && getIsBYOEAccount(user);
    const isDriveEnabled = useFlag('EasySwitchB2CForDriveWeb');
    // Also needs the base Drive flag, which loads the Drive SDK provider this flow depends on.
    const isDriveNewUIEnabled = useFlag('EasySwitchB2CForDriveWebNewUI') && isDriveEnabled && app === APPS.PROTONDRIVE;
    // B2B admins and members --> no Drive import section
    const isDriveImportRestricted = useIsDriveImportRestricted();
    const [DriveProvider, setDriveProvider] = useState<
        ((props: { children: (drive: ProtonDriveClient | undefined) => ReactNode }) => ReactNode) | null
    >(null);

    const { path } = useRouteMatch();
    const olesFeatureStatus = useOLESFeatureStatus();
    const hasAccessToOLES = olesFeatureStatus.featureSupported && olesFeatureStatus.allowedForUser;

    useEffect(() => {
        if (!isDriveEnabled) {
            return;
        }
        // @proton/drive is dynamically imported to keep it out of the activation bundle when the flag is off.
        // A static import would pull the drive SDK into every app that uses activation (mail, account, etc.).
        import('@proton/drive/LazyDriveProvider')
            .then(({ LazyDriveProvider }) => setDriveProvider(() => LazyDriveProvider))
            .catch(noop);
    }, [isDriveEnabled]);

    const renderEasySwitch = (drive?: ProtonDriveClient) => (
        <EasySwitchStoreProvider drive={drive} oauthViews={isDriveNewUIEnabled ? driveOAuthViewsOverride : undefined}>
            <EasySwitchStoreInitializer>
                <PrivateMainSettingsArea config={config}>
                    {isDriveNewUIEnabled && isDriveImportRestricted ? null : (
                        <SettingsSectionWide data-testid="SettingsArea:forwardSection">
                            <ProviderCard
                                app={app}
                                entryView={isDriveNewUIEnabled ? DriveConnectEntry : undefined}
                                showAdvancedImport={!isDriveNewUIEnabled}
                                source={
                                    hasAccessToBYOE
                                        ? EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS_BYOE
                                        : EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS
                                }
                            />
                        </SettingsSectionWide>
                    )}
                    <SettingsSectionWide>
                        {hasAccessToOLES ? (
                            <ImporterOrganizationsProvider>
                                <ImportsTable />
                            </ImporterOrganizationsProvider>
                        ) : (
                            <ImportsTable />
                        )}
                    </SettingsSectionWide>
                    <SettingsSectionWide>
                        {showByoeReminder ? (
                            <div
                                className="border border-weak rounded-xl p-4 mb-8"
                                data-testid="SettingsArea:byoeReminderSection"
                            >
                                <ByoeReminderToggle />
                            </div>
                        ) : null}
                        <SyncsTable />
                    </SettingsSectionWide>
                </PrivateMainSettingsArea>
            </EasySwitchStoreInitializer>
            {isDriveNewUIEnabled ? <DriveImportOutcomeModal /> : null}
        </EasySwitchStoreProvider>
    );

    return (
        <Switch>
            {/* Organization Level Easy Switch */}
            <Route
                path={`${path}/migration-assistant`}
                render={({ location }) => {
                    const providerParam = new URLSearchParams(location.search).get('provider') ?? undefined;
                    return <OLESSettingsArea key={providerParam} providerParam={providerParam} easySwitchPath={path} />;
                }}
            />

            {/* Easy Switch */}
            <Route>{DriveProvider ? <DriveProvider>{renderEasySwitch}</DriveProvider> : renderEasySwitch()}</Route>
        </Switch>
    );
};

export default SettingsArea;
