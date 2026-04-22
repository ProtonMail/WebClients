import { createSelector } from '@reduxjs/toolkit';
import { fromUnixTime } from 'date-fns';

import { selectAddresses } from '@proton/account/addresses';
import { selectUser } from '@proton/account/user';
import { selectUserSettings } from '@proton/account/userSettings';
import { MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';
import { getIsMnemonicAvailable } from '@proton/shared/lib/mnemonic';

export const selectMnemonicData = createSelector(
    [selectUser, selectUserSettings, selectAddresses],
    ({ value: user }, { value: userSettings }, { value: addresses }) => {
        if (!user || !addresses) {
            return {
                updateTime: null,
                isMnemonicSet: false,
                isMnemonicAvailable: false,
                mnemonicCanBeSet: false,
                mnemonicCanBeRegenerated: false,
                hasOutdatedMnemonic: false,
                createMnemonic: false,
                loading: true,
            };
        }
        const isMnemonicAvailable = getIsMnemonicAvailable({ user, addresses });
        const hasOutdatedMnemonic = user.MnemonicStatus === MNEMONIC_STATUS.OUTDATED;
        const mnemonicCanBeSet =
            user.MnemonicStatus === MNEMONIC_STATUS.ENABLED || user.MnemonicStatus === MNEMONIC_STATUS.PROMPT;
        const mnemonicCanBeRegenerated =
            user.MnemonicStatus === MNEMONIC_STATUS.SET || user.MnemonicStatus === MNEMONIC_STATUS.OUTDATED;
        const createMnemonic =
            user.MnemonicStatus === MNEMONIC_STATUS.DISABLED ||
            user.MnemonicStatus === MNEMONIC_STATUS.ENABLED ||
            user.MnemonicStatus === MNEMONIC_STATUS.PROMPT;
        const updateTime = userSettings?.Mnemonic?.UpdateTime;
        return {
            updateTime: updateTime && updateTime > 0 ? fromUnixTime(updateTime) : null,
            isMnemonicSet: user.MnemonicStatus === MNEMONIC_STATUS.SET,
            isMnemonicAvailable,
            mnemonicCanBeSet,
            mnemonicCanBeRegenerated,
            hasOutdatedMnemonic,
            createMnemonic,
            loading: false,
        };
    }
);
