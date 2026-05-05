import { createSelector } from '@reduxjs/toolkit';

import { selectMnemonicData } from '@proton/account/recovery/mnemonic';
import { selectRecoveryFileData } from '@proton/account/recovery/recoveryFile';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';

export const selectIsDataRecoveryAvailable = createSelector(
    [selectRecoveryFileData, selectMnemonicData],
    (recoveryFileData, mnemonicData) => {
        const isDataRecoveryAvailable = recoveryFileData.isRecoveryFileAvailable || mnemonicData.isMnemonicAvailable;

        return {
            isDataRecoveryAvailable,
            isRecoveryFileAvailable: recoveryFileData.isRecoveryFileAvailable,
            isMnemonicAvailable: mnemonicData.isMnemonicAvailable,
            loading: recoveryFileData.loading || mnemonicData.loading,
        };
    }
);

export const useIsDataRecoveryAvailable = (): [
    { isDataRecoveryAvailable: boolean; isRecoveryFileAvailable: boolean; isMnemonicAvailable: boolean },
    boolean,
] => {
    const { isDataRecoveryAvailable, isRecoveryFileAvailable, isMnemonicAvailable, loading } =
        useSelector(selectIsDataRecoveryAvailable);

    return [{ isDataRecoveryAvailable, isRecoveryFileAvailable, isMnemonicAvailable }, loading];
};
