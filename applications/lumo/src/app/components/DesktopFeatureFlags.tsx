import { useEffect } from 'react';

import { setDesktopFeatureFlags } from '@proton/lumo-api-client/core/desktop-tools';
import { useFlag } from '@proton/unleash/useFlag';

/** Desktop owns connector visibility; frontend evaluates the feature flags. */
export const DesktopFeatureFlags = () => {
    const experimentalConnectors = useFlag('LumoDesktopExperimentalConnectors');

    useEffect(() => {
        void setDesktopFeatureFlags({ experimentalConnectors }).catch(() => {
            console.warn('Could not report desktop feature flags');
        });
    }, [experimentalConnectors]);

    return null;
};
