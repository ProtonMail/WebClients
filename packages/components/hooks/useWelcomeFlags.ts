import { useCallback, useState } from 'react';
import { UserSettingsModel } from '@proton/shared/lib/models';
import useCache from './useCache';

export interface WelcomeFlagsState {
    hasDisplayNameStep?: boolean;
    isWelcomeFlow?: boolean;
}

const useWelcomeFlags = (): [WelcomeFlagsState, () => void] => {
    const cache = useCache();
    const [state, setState] = useState<WelcomeFlagsState>(() => {
        // Assumes that user settings has been pre-loaded. Not using hook to avoid re-renders.
        const userSettings = cache.get(UserSettingsModel.key)?.value;
        const hasProductWelcomeStep = userSettings.WelcomeFlag === 0; // Operated directly on API side
        const hasGenericWelcomeStep = userSettings.Flags.Welcomed === 0;
        return {
            hasDisplayNameStep: hasGenericWelcomeStep,
            isWelcomeFlow: hasGenericWelcomeStep || hasProductWelcomeStep,
        };
    });
    const setDone = useCallback(() => {
        setState({});
    }, []);
    return [state, setDone];
};

export default useWelcomeFlags;
