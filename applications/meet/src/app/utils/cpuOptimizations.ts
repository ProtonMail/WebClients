import { getStandaloneUnleashClient } from '@proton/unleash/standaloneClient';

/**
 * Reads the `MeetCpuOptimizations` flag from outside React.
 *
 * Most of the work this flag gates lives in the component tree and can use `useFlag`,
 * but the background processor and the E2EE recovery tuning are built outside of it,
 * so they need the standalone client instead.
 */
export const areCpuOptimizationsEnabled = (): boolean => {
    try {
        return getStandaloneUnleashClient()?.isEnabled('MeetCpuOptimizations') ?? false;
    } catch {
        return false;
    }
};
