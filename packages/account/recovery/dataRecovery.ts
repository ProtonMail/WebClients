import { createSelector } from '@reduxjs/toolkit';

import { selectMnemonicData } from '@proton/account/recovery/mnemonic';
import { selectRecoveryFileData } from '@proton/account/recovery/recoveryFile';
import { useSelector } from '@proton/redux-shared-store';

export const selectIsDataRecoveryAvailable = createSelector(
    [selectRecoveryFileData, selectMnemonicData],
    (recoveryFileData, mnemonicData) => {
        const isDataRecoveryAvailable = recoveryFileData.isRecoveryFileAvailable || mnemonicData.isMnemonicAvailable;

        return {
            isDataRecoveryAvailable,
            loading: recoveryFileData.loading || mnemonicData.loading,
        };
    }
);

export const useIsDataRecoveryAvailable = () => {
    const { isDataRecoveryAvailable, loading } = useSelector(selectIsDataRecoveryAvailable);

    return [isDataRecoveryAvailable, loading];
};
