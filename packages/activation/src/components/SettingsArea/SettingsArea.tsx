import { type ReactNode, useEffect, useState } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import type { ProtonDriveClient } from '@protontech/drive-sdk';

import type { SettingsAreaConfig } from '@proton/components';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import PrivateMainSettingsArea from '@proton/components/containers/layout/PrivateMainSettingsArea';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

import useBYOEFeatureStatus from '../../hooks/useBYOEFeatureStatus.tsx';
import { EASY_SWITCH_SOURCES } from '../../interface';
import EasySwitchStoreInitializer from '../../logic/EasySwitchStoreInitializer';
import EasySwitchStoreProvider from '../../logic/StoreProvider';
import OLESSettingsArea from '../../oles/components/SettingsArea';
import { ImporterOrganizationsProvider } from '../../oles/useImporterOrganizations';
import useOLESFeatureStatus from '../../oles/useOLESFeatureStatus';
import DriveConnectEntry from '../Modals/OAuth/Drive/DriveConnectEntry';
import { driveOAuthViewsOverride } from '../Modals/OAuth/Drive/driveOAuthViews';
import ImportsTable from '../ReportsTable/ImportsTable';
import { SyncsTable } from '../ReportsTable/SyncsTable';
import ProviderCard from './ProviderCards/ProviderCard';

import './EasySwitchTables.scss';

interface Props {
    config: SettingsAreaConfig;
    app: APP_NAMES;
}

const SettingsArea = ({ config, app }: Props) => {
    const [hasAccessToBYOE] = useBYOEFeatureStatus();
    const isDriveEnabled = useFlag('EasySwitchB2CForDriveWeb');
    // Also needs the base Drive flag, which loads the Drive SDK provider this flow depends on.
    const isDriveNewUIEnabled = useFlag('EasySwitchB2CForDriveWebNewUI') && isDriveEnabled && app === APPS.PROTONDRIVE;
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
                    <SettingsSectionWide data-testid="SettingsArea:forwardSection">
                        <ProviderCard
                            app={app}
                            entryView={isDriveNewUIEnabled ? DriveConnectEntry : undefined}
                            source={
                                hasAccessToBYOE
                                    ? EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS_BYOE
                                    : EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS
                            }
                        />
                    </SettingsSectionWide>
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
                        <SyncsTable />
                    </SettingsSectionWide>
                </PrivateMainSettingsArea>
            </EasySwitchStoreInitializer>
        </EasySwitchStoreProvider>
    );

    return (
        <Switch>
            {/* Organization Level Easy Switch */}
            {hasAccessToOLES && (
                <Route path={`${path}/migration-assistant`}>
                    <OLESSettingsArea />
                </Route>
            )}

            {/* Easy Switch */}
            <Route>{DriveProvider ? <DriveProvider>{renderEasySwitch}</DriveProvider> : renderEasySwitch()}</Route>
        </Switch>
    );
};

export default SettingsArea;
