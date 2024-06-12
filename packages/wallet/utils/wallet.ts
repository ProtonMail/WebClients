import { IWasmApiWalletData } from '../types';

export const buildMapFromWallets = (wallets: IWasmApiWalletData[] = []) => {
    return wallets.reduce(
        (acc, wallet) => ({
            ...acc,
            [wallet.Wallet.ID]: {
                wallet,
                accounts: wallet.WalletAccounts.reduce(
                    (acc, walletAccount) => ({ ...acc, [walletAccount.ID]: walletAccount }),
                    {}
                ),
            },
        }),
        {}
    );
};
