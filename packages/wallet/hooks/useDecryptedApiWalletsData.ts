import { useCallback, useEffect, useMemo, useState } from 'react';

import compact from 'lodash/compact';

import {
    type WasmApiWalletAccount,
    type WasmMigratedWallet,
    WasmMigratedWalletAccounts,
    WasmMigratedWalletTransactions,
    type WasmProtonWalletApiClient,
} from '@proton/andromeda';
import { useGetUserKeys } from '@proton/components/hooks/useUserKeys';
import useLoading from '@proton/hooks/useLoading';
import { CacheType } from '@proton/redux-utilities';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import { type DecryptedKey } from '@proton/shared/lib/interfaces';

import { useWalletApi } from '../contexts/ExtendedApiContext';
import { useApiWalletsData, useGetApiWalletsData } from '../store';
import { type IWasmApiWalletData } from '../types';
import { decryptTransactionData, getPassphraseLocalStorageKey } from '../utils';
import {
    decryptWalletData,
    decryptWalletKey,
    decryptWalletKeyForHmac,
    encryptWalletData,
    encryptWalletDataWithWalletKey,
    hmac,
} from '../utils/crypto';
import { buildMapFromWallets } from '../utils/wallet';
import { useGetAllAddressesKeys } from './useGetAllAddressesKeys';

export type WalletMap = Partial<
    Record<string, { wallet: IWasmApiWalletData; accounts: Partial<Record<string, WasmApiWalletAccount>> }>
>;

const decryptWallet = async ({
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
    const encryptedLabels = WalletAccounts.map((account) => account.Label);

    try {
        const decryptedWalletKey = await decryptWalletKey(WalletKey.WalletKey, WalletKey.WalletKeySignature, userKeys);

        const encryptedPassphrase = Wallet.Fingerprint
            ? localStorage.getItem(getPassphraseLocalStorageKey(Wallet.Fingerprint))
            : null;

        const [decryptedMnemonic, decryptedWalletName, decryptedPublickey, decryptedPassphrase, ...decryptedLabels] =
            await decryptWalletData(
                [Wallet.Mnemonic, Wallet.Name, Wallet.PublicKey, encryptedPassphrase, ...encryptedLabels],
                decryptedWalletKey
            );

        const decryptedWallet = {
            ...Wallet,
            ...(decryptedWalletName && { Name: decryptedWalletName }),
            ...(decryptedMnemonic && { Mnemonic: decryptedMnemonic }),
            ...(decryptedPublickey && { PublicKey: decryptedPublickey }),
            ...(decryptedPassphrase && { Passphrase: decryptedPassphrase }),
        };

        const decryptedAccounts = WalletAccounts.map((account, index) => {
            const decryptedLabel = decryptedLabels[index];
            return {
                ...account,
                ...(decryptedLabel && { Label: decryptedLabel }),
            };
        });

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

const migrateWallet = async ({
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

        UserKeyID: userKeyToUse.ID,
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

            // Typeguard: no transaction should have empty wallet account id or transaction id or hashed transaction id (might be duplicate transaction)
            if (
                !decryptedTransaction.WalletAccountID ||
                !decryptedTransaction.TransactionID ||
                (!decryptedTransaction.HashedTransactionID && !decryptedTransaction.Label)
            ) {
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

export const useDecryptedApiWalletsData = () => {
    const getApiWalletsData = useGetApiWalletsData();
    const [apiWalletsData] = useApiWalletsData();
    const walletApi = useWalletApi();

    const getUserKeys = useGetUserKeys();
    const getAddressKeys = useGetAllAddressesKeys();
    const [loadingApiWalletsData, withLoadingApiWalletsData] = useLoading();

    const [decryptedApiWalletsData, setDecryptedApiWalletsData] = useState<IWasmApiWalletData[]>();

    const getDecryptedApiWalletsData = useCallback(
        async (inputApiWalletsData: IWasmApiWalletData[] | null, shouldMigrate = true) => {
            const userKeys = await getUserKeys();
            const addressKeys = await getAddressKeys();

            const apiWalletsData =
                inputApiWalletsData ??
                (await getApiWalletsData({
                    cache: CacheType.None,
                }));

            let didMigration = false;

            const apiWallets = await Promise.all(
                apiWalletsData?.map(async (apiWalletData) => {
                    const wallet = await decryptWallet({ apiWalletData, userKeys });

                    if (wallet?.Wallet.MigrationRequired) {
                        didMigration = true;
                        await migrateWallet({ wallet, walletApi, userKeys, addressKeys });
                    }

                    return wallet;
                }) ?? []
            );

            if (didMigration && shouldMigrate) {
                return getDecryptedApiWalletsData(null, false);
            }

            const wallets = compact(apiWallets);

            setDecryptedApiWalletsData(wallets);
            return wallets;
        },
        []
    );

    useEffect(() => {
        if (apiWalletsData) {
            void withLoadingApiWalletsData(getDecryptedApiWalletsData(apiWalletsData));
        }
    }, [apiWalletsData]);

    const setPassphrase = useCallback((walletId: string, Passphrase: string) => {
        setDecryptedApiWalletsData((prev) => {
            if (!prev) {
                return undefined;
            }

            const walletIndex = prev?.findIndex((value) => value.Wallet.ID === walletId);

            const updated: IWasmApiWalletData = {
                ...prev[walletIndex],
                Wallet: { ...prev[walletIndex].Wallet, Passphrase },
            };

            return walletIndex > -1 ? [...prev.slice(0, walletIndex), updated, ...prev.slice(walletIndex + 1)] : prev;
        });
    }, []);

    const walletMap: WalletMap = useMemo(() => {
        return buildMapFromWallets(decryptedApiWalletsData);
    }, [decryptedApiWalletsData]);

    /**
     * We want to display a loading state either when we are fetching api data or when we are decrypting it and we don't have data on client yet
     */
    const loading = loadingApiWalletsData && !decryptedApiWalletsData;

    return {
        decryptedApiWalletsData,
        getDecryptedApiWalletsData,

        walletMap,
        loading,
        setPassphrase,
    };
};
