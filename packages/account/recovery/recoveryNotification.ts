import { createSelector } from '@reduxjs/toolkit';

import { selectAddresses } from '@proton/account/addresses';
import { selectIsDataRecoveryAvailable } from '@proton/account/recovery/dataRecovery';
import { selectMnemonicData } from '@proton/account/recovery/mnemonic';
import { selectRecoveryFileData } from '@proton/account/recovery/recoveryFile';
import { selectLegacySentinel } from '@proton/account/recovery/sentinelSelectors';
import { selectUser } from '@proton/account/user';
import { selectUserSettings } from '@proton/account/userSettings';
import { getLikelyHasKeysToReactivate } from '@proton/shared/lib/keys/getInactiveKeys';

export type RecoveryStatus = 'complete' | 'intermediate' | 'incomplete';

interface Props {
    accountRecoveryStatus: RecoveryStatus;
    dataRecoveryStatus: RecoveryStatus;
    isDataRecoveryAvailable: boolean;
}

export const getOverallStatus = ({
    accountRecoveryStatus,
    dataRecoveryStatus,
    isDataRecoveryAvailable,
}: Props): RecoveryStatus => {
    if (accountRecoveryStatus !== 'complete') {
        return 'incomplete';
    }

    if (isDataRecoveryAvailable && dataRecoveryStatus !== 'complete') {
        return 'intermediate';
    }

    return 'complete';
};

export const selectRecoveryNotification = createSelector(
    [
        selectUser,
        selectUserSettings,
        selectAddresses,
        selectRecoveryFileData,
        selectMnemonicData,
        selectIsDataRecoveryAvailable,
        selectLegacySentinel,
    ],
    (
        { value: user },
        { value: userSettings },
        { value: addresses },
        recoveryFileData,
        mnemonicData,
        dataRecovery,
        sentinelData
    ) => {
        const hasVerifiedRecoveryEmailAddress = !!userSettings?.Email?.Reset && !!userSettings?.Email?.Value;
        const hasRecoveryPhoneNumber = !!userSettings?.Phone?.Reset && !!userSettings?.Phone?.Value;

        const accountRecoveryStatus: RecoveryStatus =
            hasVerifiedRecoveryEmailAddress || hasRecoveryPhoneNumber ? 'complete' : 'incomplete';

        const mnemonicIsSet = mnemonicData.isMnemonicSet;
        const dataRecoveryStatus: RecoveryStatus =
            mnemonicIsSet || recoveryFileData.hasCurrentRecoveryFile ? 'complete' : 'incomplete';

        const hasKeysToReactivate = getLikelyHasKeysToReactivate(user, addresses);

        const overallStatus = getOverallStatus({
            accountRecoveryStatus,
            dataRecoveryStatus,
            isDataRecoveryAvailable: dataRecovery.isDataRecoveryAvailable,
        });

        return {
            overallStatus,
            hasKeysToReactivate,
            mnemonicData,
            recoveryFileData,
            dataRecovery,
            sentinelData,
            loading: !userSettings || mnemonicData.loading || recoveryFileData.loading,
        };
    }
);
