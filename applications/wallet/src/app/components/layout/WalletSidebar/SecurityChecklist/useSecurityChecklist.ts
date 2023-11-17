import { getOverallStatus } from '@proton/components/containers';
import { useIsDataRecoveryAvailable, useRecoveryStatus, useUserSettings } from '@proton/components/hooks';
import { isProtonSentinelEligible } from '@proton/shared/lib/helpers/userSettings';

export const useSecurityChecklist = () => {
    const [userSettings] = useUserSettings();

    const [{ accountRecoveryStatus, dataRecoveryStatus }, loadingRecoveryStatus] = useRecoveryStatus();
    const [isDataRecoveryAvailable, loadingIsDataRecoveryAvailable] = useIsDataRecoveryAvailable();
    const recoveryOverallStatus = getOverallStatus({
        accountRecoveryStatus,
        dataRecoveryStatus,
        isDataRecoveryAvailable,
    });

    return {
        shouldSetRecovery: recoveryOverallStatus !== 'complete',
        loadingRecovery: loadingRecoveryStatus || loadingIsDataRecoveryAvailable,

        shouldActivate2FA: !Boolean(userSettings['2FA'].Enabled),

        shouldGetProtonSentinel: !isProtonSentinelEligible(userSettings),
    };
};
