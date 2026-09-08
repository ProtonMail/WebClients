import { Redirect } from 'react-router-dom';

import { c } from 'ttag';

import useAppTitle from '@proton/components/hooks/useAppTitle';

import { OLES_PROVIDERS, getProviderFromRouteSlug } from '../providers';
import { ConnectionStateProvider } from '../useConnectionState';
import { ImporterOrganizationsProvider } from '../useImporterOrganizations';
import useOLESFeatureStatus from '../useOLESFeatureStatus';
import { ProviderTokensProvider } from '../useProviderTokens';
import { ProviderUsersProvider } from '../useProviderUsers';
import MigrationFlow from './MigrationFlow';

const SettingsArea = ({ providerParam = '', easySwitchPath }: { providerParam?: string; easySwitchPath: string }) => {
    useAppTitle(c('Title').t`Migration assistant`);

    const olesFeatureStatus = useOLESFeatureStatus();

    if (olesFeatureStatus.loading) {
        return null;
    }

    const hasAccessToOLES = olesFeatureStatus.featureSupported && olesFeatureStatus.allowedForUser;

    const resolvedProvider = getProviderFromRouteSlug(providerParam);
    const provider =
        hasAccessToOLES && resolvedProvider && olesFeatureStatus.isProviderEnabled(resolvedProvider)
            ? OLES_PROVIDERS[resolvedProvider]
            : undefined;

    if (!provider) {
        return <Redirect to={easySwitchPath} />;
    }

    return (
        <ProviderTokensProvider>
            <ImporterOrganizationsProvider>
                <ProviderUsersProvider>
                    <ConnectionStateProvider>
                        <MigrationFlow provider={provider} />
                    </ConnectionStateProvider>
                </ProviderUsersProvider>
            </ImporterOrganizationsProvider>
        </ProviderTokensProvider>
    );
};

export default SettingsArea;
