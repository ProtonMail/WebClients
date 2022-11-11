import { useLayoutEffect } from 'react';

import { useSettingsLink } from '../components';
import useIsProtonMailDomainMigrationEnabled from './useIsProtonMailDomainMigrationEnabled';

export default function useProtonMailMigrationRedirect() {
    const settingsLink = useSettingsLink();
    const [isProtonMailDomainMigrationEnabled, isProtonMailDomainMigrationEnabledLoading] =
        useIsProtonMailDomainMigrationEnabled();

    useLayoutEffect(() => {
        if (!isProtonMailDomainMigrationEnabled || isProtonMailDomainMigrationEnabledLoading) {
            return;
        }

        settingsLink('/dashboard?action=show-migration-modal');
    }, [isProtonMailDomainMigrationEnabledLoading]);
}
