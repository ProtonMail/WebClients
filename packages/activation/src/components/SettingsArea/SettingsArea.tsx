import { type ReactNode, useEffect, useState } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import type { ProtonDriveClient } from '@protontech/drive-sdk';

import { SyncsTable } from '@proton/activation/src/components/ReportsTable/SyncsTable';
import useBYOEFeatureStatus from '@proton/activation/src/hooks/useBYOEFeatureStatus.tsx';
import { EASY_SWITCH_SOURCES } from '@proton/activation/src/interface';
import EasySwitchStoreInitializer from '@proton/activation/src/logic/EasySwitchStoreInitializer';
import OLESSettingsArea from '@proton/activation/src/oles/components/SettingsArea';
import type { SettingsAreaConfig } from '@proton/components';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import PrivateMainSettingsArea from '@proton/components/containers/layout/PrivateMainSettingsArea';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

import EasySwitchStoreProvider from '../../logic/StoreProvider';
import { ImporterOrganizationsProvider } from '../../oles/useImporterOrganizations';
import useOLESFeatureStatus from '../../oles/useOLESFeatureStatus';
import ImportsTable from '../ReportsTable/ImportsTable';
import ProviderCard from './ProviderCards/ProviderCard';

import './EasySwitchTables.scss';

interface Props {
    config: SettingsAreaConfig;
    app: APP_NAMES;
}

const SettingsArea = ({ config, app }: Props) => {
    const [hasAccessToBYOE] = useBYOEFeatureStatus();
    const isDriveEnabled = useFlag('EasySwitchB2CForDriveWeb');
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
        <EasySwitchStoreProvider drive={drive}>
            <EasySwitchStoreInitializer>
                <PrivateMainSettingsArea config={config}>
                    <SettingsSectionWide data-testid="SettingsArea:forwardSection">
                        <ProviderCard
                            app={app}
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
