import { selectUserKeys } from '@proton/account';

import { type IWasmApiWalletData } from '../../types';
import { eventLoopEvent, stateFromWalletAccountEvent, stateFromWalletEvent } from '../../utils';
import { selectApiWalletsData, setWallets } from '../slices';
import type { AppStartListening } from '../store';

export const startWalletEventListener = (startListening: AppStartListening) => {
    startListening({
        actionCreator: eventLoopEvent,
        effect: async (action, listenerApi) => {
            if (!action.payload.Wallets && !action.payload.WalletAccounts) {
                return;
            }

            const state = listenerApi.getState();
            const userKeys = selectUserKeys(state).value;
            const wallets = selectApiWalletsData(state).value;

            if (!userKeys || !wallets) {
                return;
            }

            let updatedWallets: IWasmApiWalletData[] = [...wallets];
            for (const walletEvent of action.payload.Wallets ?? []) {
                if (wallets) {
                    updatedWallets = await stateFromWalletEvent(walletEvent, action.payload, wallets, userKeys);
                }
            }

            for (const walletAccountAction of action.payload.WalletAccounts ?? []) {
                if (wallets) {
                    updatedWallets = await stateFromWalletAccountEvent(walletAccountAction, wallets, userKeys);
                }
            }

            listenerApi.dispatch(setWallets(updatedWallets));
        },
    });
};
