import { useContext, useEffect } from 'react';

import useConfig from '@proton/components/hooks/useConfig';
import { isNewVersionAvailable } from '@proton/shared/lib/busy/busy';
import { CommonFeatureFlag } from '@proton/unleash/Flags';
import { unleashStorageProvider } from '@proton/unleash/UnleashFlagProvider';
import { FlagContext, useUnleashClient } from '@proton/unleash/proxy';

/**
 * Component that handles force reload functionality.
 * It checks for new version available and reloads the page if ForceReload flag is enabled.
 * Renders nothing (and does nothing) when no FlagProvider is mounted above it.
 */
const ForceReload = () => {
    const flagContext = useContext(FlagContext);
    const unleashClient = useUnleashClient();
    const config = useConfig();

    useEffect(() => {
        if (!flagContext) {
            return;
        }

        const handleUpdate = async () => {
            const isForceReloadEnabled = unleashClient.isEnabled(CommonFeatureFlag.ForceReload);

            if (!isForceReloadEnabled) {
                return;
            }

            const hasNewVersion = await isNewVersionAvailable(config);

            if (!hasNewVersion) {
                return;
            }

            // Clear unleash storage before reload to ensure fresh feature flag state
            unleashStorageProvider.clear();

            window.location.reload();
        };

        unleashClient.on('update', handleUpdate);

        return () => {
            unleashClient.off('update', handleUpdate);
        };
    }, [flagContext, unleashClient, config]);

    return null;
};

export default ForceReload;
