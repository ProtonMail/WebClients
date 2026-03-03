import { ConnectionStateProvider } from '../useConnectionState';
import { ImporterOrganizationProvider } from '../useImporterOrganization';
import { ProviderUsersProvider } from '../useProviderUsers';
import MigrationFlow from './MigrationFlow';

const SettingsArea = () => {
    return (
        <ImporterOrganizationProvider>
            <ProviderUsersProvider>
                <ConnectionStateProvider>
                    <MigrationFlow />
                </ConnectionStateProvider>
            </ProviderUsersProvider>
        </ImporterOrganizationProvider>
    );
};

export default SettingsArea;
