import { c } from 'ttag';

import {
    type WasmApiWallet,
    type WasmApiWalletAccount,
    type WasmMigratedWallet,
    WasmMigratedWalletAccounts,
    WasmMigratedWalletTransactions,
    type WasmProtonWalletApiClient,
} from '@proton/andromeda';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import { type DecryptedKey } from '@proton/shared/lib/interfaces';

import { type IWasmApiWalletData } from '../types';
import {
    decryptWalletData,
    decryptWalletKey,
    decryptWalletKeyForHmac,
    encryptWalletData,
    encryptWalletDataWithWalletKey,
    hmac,
} from './crypto';
import { getPassphraseLocalStorageKey } from './localStorage';
import { decryptTransactionData } from './transactions';

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

        const [decryptedMnemonic, decryptedWalletName, decryptedPublickey, decryptedPassphrase] =
            await decryptWalletData(
                [Wallet.Mnemonic, Wallet.Name, Wallet.PublicKey, encryptedPassphrase],
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

export const migrateWallet = async ({
    wallet,
    walletApi,
    userKeys,
    addressKeys,
}: {
    wallet: IWasmApiWalletData;
    walletApi: WasmProtonWalletApiClient;
    userKeys: DecryptedKey[];
    addressKeys: DecryptedKey[];
}) => {
    const { Wallet, WalletKey, WalletAccounts } = wallet;

    const oldWalletKey = WalletKey?.DecryptedKey;

    // Typeguard: no wallet should have empty wallet key, mnemonic or fingerprint
    if (!oldWalletKey || !Wallet.Mnemonic || !Wallet.Fingerprint) {
        return;
    }

    const userKeyToUse = userKeys.find((k) => k.ID === WalletKey.UserKeyID);

    // We won't migrate wallets whose user key is not available anymore
    if (!userKeyToUse) {
        return;
    }

    const [[encryptedName, encryptedMnemonic], [encryptedWalletKey, walletKeySignature, newWalletKey]] =
        await encryptWalletData([Wallet.Name, Wallet.Mnemonic], userKeyToUse);

    // Hmac key will be used for hashing transaction ids with new wallet key
    const hmacKey = await decryptWalletKeyForHmac(encryptedWalletKey, walletKeySignature, userKeys);

    const migratedWallet: WasmMigratedWallet = {
        Name: encryptedName,
        Mnemonic: encryptedMnemonic,
        Fingerprint: Wallet.Fingerprint,
        UserKeyID: WalletKey.UserKeyID,
        WalletKey: encryptedWalletKey,
        WalletKeySignature: walletKeySignature,
    };

    const migratedWalletAccounts = new WasmMigratedWalletAccounts();
    const migratedWalletTransactions = new WasmMigratedWalletTransactions();
    const migratedHashedTransactionIds = new Set<string>();

    for (const account of WalletAccounts) {
        const [encryptedLabel] = await encryptWalletDataWithWalletKey([account.Label], newWalletKey);
        const migratedAccount = {
            Label: encryptedLabel,
            ID: account.ID,
        };

        // Add account to the migrated wallet accounts
        migratedWalletAccounts.push(migratedAccount);

        // Get all transactions for the migrated account
        const walletAccountTransactions = await walletApi
            .clients()
            .wallet.getWalletTransactions(account.WalletID, account.ID);

        for (const transaction of walletAccountTransactions[0]) {
            const decryptedTransaction = await decryptTransactionData(
                transaction.Data,
                oldWalletKey,
                userKeys.map((k) => k.privateKey),
                addressKeys.map((k) => k.privateKey)
            );

            // Typeguard: no transaction should have empty wallet account id or transaction id
            if (!decryptedTransaction.WalletAccountID || !decryptedTransaction.TransactionID) {
                continue;
            }

            const hashedTxIdBuffer = await hmac(hmacKey, decryptedTransaction.TransactionID);
            const hashedTxId = uint8ArrayToBase64String(new Uint8Array(hashedTxIdBuffer));

            // We don't want to migrate a row coupled to the same transaction twice
            if (migratedHashedTransactionIds.has(hashedTxId)) {
                continue;
            }

            migratedHashedTransactionIds.add(hashedTxId);

            const [encryptedLabel] = decryptedTransaction.Label
                ? await encryptWalletDataWithWalletKey([decryptedTransaction.Label], newWalletKey)
                : [null];

            // Add transaction to the migrated wallet transactions
            migratedWalletTransactions.push({
                ID: decryptedTransaction.ID,
                WalletAccountID: decryptedTransaction.WalletAccountID,
                HashedTransactionID: hashedTxId,
                Label: encryptedLabel,
            });
        }
    }

    await walletApi
        .clients()
        .wallet.migrate(Wallet.ID, migratedWallet, migratedWalletAccounts, migratedWalletTransactions);
};
