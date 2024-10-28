import { useEffect, useState } from 'react';

import { type SimpleMap } from '@proton/shared/lib/interfaces';
import type { IWasmApiWalletData } from '@proton/wallet';

import { useBitcoinBlockchainContext } from '../contexts';
import { getAccountBalance, getAccountWithChainDataFromManyWallets } from '../utils';

export const useBvEWarning = (wallet: IWasmApiWalletData) => {
    const [bveWarningByAccountId, setBveWarningByAccountId] = useState<SimpleMap<boolean>>({});

    const { walletsChainData } = useBitcoinBlockchainContext();

    useEffect(() => {
        const run = async () => {
            for (const account of wallet.WalletAccounts) {
                const accountChainData = getAccountWithChainDataFromManyWallets(
                    walletsChainData,
                    account.WalletID,
                    account.ID
                );

                const balance = await getAccountBalance(accountChainData);
                setBveWarningByAccountId((prev) => ({
                    ...prev,
                    [account.ID]: account.Priority === 1 || balance > 0,
                }));
            }
        };

        void run();
    }, [wallet.WalletAccounts, walletsChainData]);

    return { bveWarningByAccountId };
};
