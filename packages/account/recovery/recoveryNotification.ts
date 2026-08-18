import { createSelector } from '@reduxjs/toolkit';

import { getLikelyHasKeysToReactivate } from '@proton/shared/lib/keys/getInactiveKeys';

import { selectAddresses } from '../addresses';
import { selectUser } from '../user';
import { selectUserSettings } from '../userSettings';
import { selectIsDataRecoveryAvailable } from './dataRecovery';
import { selectMnemonicData } from './mnemonic';
import { selectRecoveryFileData } from './recoveryFile';
import { selectLegacySentinel } from './sentinelSelectors';

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
