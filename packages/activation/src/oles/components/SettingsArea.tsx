import { c } from 'ttag';

import useAppTitle from '@proton/components/hooks/useAppTitle';

import { ConnectionStateProvider } from '../useConnectionState';
import { ImporterOrganizationsProvider } from '../useImporterOrganizations';
import { ProviderTokensProvider } from '../useProviderTokens';
import { ProviderUsersProvider } from '../useProviderUsers';
import MigrationFlow from './MigrationFlow';

const SettingsArea = () => {
    useAppTitle(c('Title').t`Migration assistant`);

    return (
        <ProviderTokensProvider>
            <ImporterOrganizationsProvider>
                <ProviderUsersProvider>
                    <ConnectionStateProvider>
                        <MigrationFlow />
                    </ConnectionStateProvider>
                </ProviderUsersProvider>
            </ImporterOrganizationsProvider>
        </ProviderTokensProvider>
    );
};

export default SettingsArea;
