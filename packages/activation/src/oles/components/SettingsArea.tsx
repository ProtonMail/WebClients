import { ImporterOrganizationProvider } from '../useImporterOrganization';
import { ProviderUsersProvider } from '../useProviderUsers';
import MigrationFlow from './MigrationFlow';

const SettingsArea = () => {
    return (
        <ImporterOrganizationProvider>
            <ProviderUsersProvider>
                <MigrationFlow />
            </ProviderUsersProvider>
        </ImporterOrganizationProvider>
    );
};

export default SettingsArea;
