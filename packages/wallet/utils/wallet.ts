import { c } from 'ttag';

import { type WasmApiWallet, type WasmApiWalletAccount } from '@proton/andromeda';
import { type DecryptedKey } from '@proton/shared/lib/interfaces';

import { type IWasmApiWalletData } from '../types';
import { decryptMnemonicWithUserKey, decryptWalletData, decryptWalletKey } from './crypto';
import { getPassphraseLocalStorageKey } from './localStorage';

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

export const getDefaultWalletName = (imported: boolean, wallets: IWasmApiWalletData[], index = 0): string => {
    const indexStr = index ? ` ${index}` : '';

    const name = imported
        ? c('wallet_signup_2024:Wallet setup').t`My imported wallet${indexStr}`
        : c('wallet_signup_2024:Wallet setup').t`My wallet${indexStr}`;

    if (wallets.some((wallet) => wallet.Wallet.Name === name)) {
        return getDefaultWalletName(imported, wallets, index + 1);
    }

    return name;
};

export const getDefaultWalletAccountName = (walletAccounts: WasmApiWalletAccount[], index = 2): string => {
    const indexStr = index.toString();
    const label = c('wallet_signup_2024:Wallet setup').t`Account ${indexStr}`;

    if (walletAccounts.some((account) => account.Label === label)) {
        return getDefaultWalletAccountName(walletAccounts, index + 1);
    }

    return label;
};

export const toWalletAccountSelectorOptions = (wallets: IWasmApiWalletData[]) =>
    wallets?.map((wallet) => [wallet.Wallet, wallet.WalletAccounts] as [WasmApiWallet, WasmApiWalletAccount[]]) ?? [];

export const decryptWalletAccount = async ({
    walletAccount,
    walletKey,
}: {
    walletAccount: WasmApiWalletAccount;
    walletKey: CryptoKey;
}) => {
    const [decryptedLabel] = await decryptWalletData([walletAccount.Label], walletKey);

    return {
        ...walletAccount,
        ...(decryptedLabel && { Label: decryptedLabel }),
    };
};

export const decryptWallet = async ({
    apiWalletData,
    userKeys,
}: {
    apiWalletData: IWasmApiWalletData;
    userKeys: DecryptedKey[];
}) => {
    // A wallet normally cannot be created without a wallet key
    if (!apiWalletData.WalletKey || !apiWalletData.WalletSettings) {
        return null;
    }

    const { Wallet, WalletKey, WalletSettings, WalletAccounts } = apiWalletData;

    try {
        const decryptedWalletKey = await decryptWalletKey(WalletKey.WalletKey, WalletKey.WalletKeySignature, userKeys);

        const encryptedPassphrase = Wallet.Fingerprint
            ? localStorage.getItem(getPassphraseLocalStorageKey(Wallet.Fingerprint))
            : null;

        // Backward compatibility with mnemonic encrypted with user key in addition to the wallet key
        const encryptedMnemonic = Wallet.Legacy
            ? await decryptMnemonicWithUserKey(Wallet.Mnemonic, userKeys)
            : Wallet.Mnemonic;
        const [decryptedMnemonic, decryptedWalletName, decryptedPublickey, decryptedPassphrase] =
            await decryptWalletData(
                [encryptedMnemonic, Wallet.Name, Wallet.PublicKey, encryptedPassphrase],
                decryptedWalletKey
            );

        const decryptedWallet = {
            ...Wallet,
            ...(decryptedWalletName && { Name: decryptedWalletName }),
            ...(decryptedMnemonic && { Mnemonic: decryptedMnemonic }),
            ...(decryptedPublickey && { PublicKey: decryptedPublickey }),
            ...(decryptedPassphrase && { Passphrase: decryptedPassphrase }),
        };

        const decryptedAccounts = await Promise.all(
            WalletAccounts.map((account) =>
                decryptWalletAccount({ walletAccount: account, walletKey: decryptedWalletKey })
            )
        );

        const data: IWasmApiWalletData = {
            Wallet: decryptedWallet,
            WalletAccounts: decryptedAccounts,
            WalletKey: { ...WalletKey, DecryptedKey: decryptedWalletKey },
            WalletSettings: WalletSettings,
        };

        return data;
    } catch (e) {
        const data: IWasmApiWalletData = {
            Wallet,
            WalletKey,
            WalletSettings,
            WalletAccounts,
            IsNotDecryptable: true,
        };

        return data;
    }
};
