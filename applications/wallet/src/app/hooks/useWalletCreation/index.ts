import { useCallback, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { noop } from 'lodash';
import { c } from 'ttag';

import type {
    WasmApiEmailAddress,
    WasmFiatCurrencySymbol,
    WasmNetwork,
    WasmProtonWalletApiClient,
    WasmScriptType,
} from '@proton/andromeda';
import { WasmDerivationPath, WasmMnemonic, WasmWallet } from '@proton/andromeda';
import { useAddresses, useNotifications, useOrganization, useUserKeys } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import {
    DEFAULT_ACCOUNT_LABEL,
    DEFAULT_SCRIPT_TYPE,
    FIRST_INDEX,
    WalletType,
    encryptWalletData,
    encryptWalletDataWithWalletKey,
    getDefaultWalletName,
    useUserWalletSettings,
    useWalletApi,
    useWalletApiClients,
    walletCreation,
    wordCountToNumber,
} from '@proton/wallet';

import { DEFAULT_MAX_SUB_WALLETS } from '../../constants/wallet';
import { useBitcoinBlockchainContext } from '../../contexts';
import { useFiatCurrencies, useWalletDispatch } from '../../store/hooks';
import { isUndefined } from '../../utils';

const parseMnemonic = (value?: string): { mnemonic: WasmMnemonic } | { error: string } => {
    const words = value?.trim().split(' ') ?? [];

    if (!Object.values(wordCountToNumber).includes(words.length)) {
        return { error: c('Wallet setup').t`Mnemonic length is not valid.` };
    }

    try {
        const parsed = WasmMnemonic.fromString(words.join(' '));
        return { mnemonic: parsed };
    } catch {
        return { error: c('Wallet setup').t`Input mnemonic is invalid, please double check.` };
    }
};

const getWalletAccountsToCreate = async ({
    isImported,
    walletApi,
    wasmWallet,
    decryptedWalletKey,
    network,
}: {
    isImported: boolean;
    wasmWallet: WasmWallet;
    walletApi: WasmProtonWalletApiClient;
    decryptedWalletKey: CryptoKey;
    network: WasmNetwork;
}): Promise<[WasmDerivationPath, string, WasmScriptType][]> => {
    if (isImported) {
        const discoveredAccounts = await wasmWallet.discoverAccounts(walletApi);

        const encryptedLabels = await encryptWalletDataWithWalletKey(
            new Array(discoveredAccounts.data.length).fill('').map((a, index) => `Wallet account ${index}`),
            decryptedWalletKey
        );

        const accountsToCreate = discoveredAccounts.data.map((account, index) => {
            const args: [WasmDerivationPath, string, WasmScriptType] = [account[2], encryptedLabels[index], account[0]];

            return args;
        });

        if (accountsToCreate.length) {
            return accountsToCreate;
        }
    }

    const derivationPath = WasmDerivationPath.fromParts(DEFAULT_SCRIPT_TYPE, network, FIRST_INDEX);
    const [encryptedFirstAccountLabel] = await encryptWalletDataWithWalletKey(
        [DEFAULT_ACCOUNT_LABEL],
        decryptedWalletKey
    );

    return [[derivationPath, encryptedFirstAccountLabel, DEFAULT_SCRIPT_TYPE]];
};

interface Props {
    /**
     * Called when wallet setup is finished without any wallet created
     */
    onSetupFinish: (data: { notCreatedAccounts: number }) => void;
}

export const useWalletCreation = ({ onSetupFinish }: Props) => {
    const history = useHistory();
    const [settings, loadingSettings] = useUserWalletSettings();
    const [organization] = useOrganization();

    const [addresses] = useAddresses();

    const { createNotification } = useNotifications();

    const { decryptedApiWalletsData, network } = useBitcoinBlockchainContext();

    const [mnemonicError, setMnemonicError] = useState<string>();
    const [mnemonic, setMnemonic] = useState<string>();
    const [passphrase, setPassphrase] = useState<string>();
    const [confirmedPassphrase, setConfirmedPassphrase] = useState<string>();
    const [error, setError] = useState<string>('');

    const [walletName, setWalletName] = useState<string>('');
    const walletApi = useWalletApi();

    const [currencies, loadingCurrencies] = useFiatCurrencies();
    const [selectedCurrency, setSelectedCurrency] = useState<WasmFiatCurrencySymbol>();

    const [userKeys] = useUserKeys();

    const api = useWalletApiClients();
    const dispatch = useWalletDispatch();

    const handleWalletNameChange = useCallback((name: string) => {
        setWalletName(name);
    }, []);

    const handleMnemonicChange = useCallback((mnemonic: string) => {
        setMnemonic(mnemonic);
    }, []);

    const handlePassphraseChange = useCallback((passphrase: string) => {
        setPassphrase(passphrase);
    }, []);

    const handleConfirmedPassphraseChange = useCallback((confirmedPassphrase: string) => {
        setConfirmedPassphrase(confirmedPassphrase);
    }, []);

    const [loadingWalletSubmit, withLoadingWalletSubmit] = useLoading();

    useEffect(() => {
        if (mnemonicError) {
            const result = parseMnemonic(mnemonic);
            setMnemonicError('error' in result ? result.error : undefined);
        }
    }, [mnemonicError, mnemonic]);

    const onWalletSubmit = async ({
        shouldAutoAddEmailAddress,
        isImported = false,
    }: {
        shouldAutoAddEmailAddress?: boolean;
        isImported?: boolean;
    }) => {
        // Typeguard
        if (!userKeys || isUndefined(network) || !selectedCurrency) {
            return;
        }

        const result = parseMnemonic(mnemonic);

        if ('error' in result) {
            setMnemonicError(result.error);
            return;
        }

        const [primaryUserKey] = userKeys;

        const hasPassphrase = !!passphrase;

        const mnemonicStr = result.mnemonic.asString();
        const compelledWalletName = walletName || getDefaultWalletName(isImported, decryptedApiWalletsData ?? []);

        // TODO: add public key support here
        const [
            [encryptedName, encryptedMnemonic],
            [encryptedWalletKey, walletKeySignature, decryptedWalletKey, userKeyId],
        ] = await encryptWalletData([compelledWalletName, mnemonicStr], primaryUserKey);

        const wasmWallet = new WasmWallet(network, mnemonicStr, passphrase);
        const fingerprint = wasmWallet.getFingerprint();

        try {
            const accounts = await getWalletAccountsToCreate({
                isImported,
                walletApi,
                decryptedWalletKey,
                network,
                wasmWallet,
            });

            const wallet = await api.wallet.createWallet(
                encryptedName,
                isImported,
                WalletType.OnChain,
                hasPassphrase,
                userKeyId,
                encryptedWalletKey,
                walletKeySignature,
                encryptedMnemonic,
                fingerprint,
                undefined
            );

            const { Wallet, WalletKey, WalletSettings } = wallet;

            const walletAccountPerWalletLimit = organization?.MaxSubWallets ?? DEFAULT_MAX_SUB_WALLETS;

            const accountsWithinUserLimit = accounts.slice(0, walletAccountPerWalletLimit);
            const accountsAboveLimits = accounts.slice(walletAccountPerWalletLimit);

            const createdAccounts = [];
            for (const account of accountsWithinUserLimit) {
                const created = await api.wallet.createWalletAccount(Wallet.ID, ...account).catch((error: any) => {
                    createNotification({
                        text: error?.error ?? c('Wallet setup').t`Could not create wallet account`,
                        type: 'error',
                    });

                    return null;
                });

                if (created) {
                    await api.wallet
                        .updateWalletAccountFiatCurrency(Wallet.ID, created.Data.ID, selectedCurrency)
                        .catch(noop);

                    createdAccounts.push({ ...created.Data, FiatCurrency: selectedCurrency });
                }
            }

            const [firstWalletAccount, ...others] = createdAccounts;
            const [firstAddress] = addresses ?? [];

            const addedEmailAddresses: WasmApiEmailAddress[] = [];
            if (firstWalletAccount && shouldAutoAddEmailAddress) {
                try {
                    await api.wallet.addEmailAddress(Wallet.ID, firstWalletAccount.ID, firstAddress.ID);
                    addedEmailAddresses.push({ ID: firstAddress.ID, Email: firstAddress.Email });
                } catch (error: any) {
                    createNotification({
                        text: error?.error ?? c('Wallet setup').t`Could not link email to wallet account`,
                        type: 'error',
                    });
                }
            }

            dispatch(
                walletCreation({
                    Wallet,
                    WalletKey,
                    WalletSettings,
                    WalletAccounts: [{ ...firstWalletAccount, Addresses: addedEmailAddresses }, ...others],
                })
            );

            history.push(`/wallets/${Wallet.ID}`);
            onSetupFinish({ notCreatedAccounts: accountsAboveLimits.length });
        } catch (error: any) {
            createNotification({
                text: error?.error ?? c('Wallet setup').t`Could not create wallet`,
                type: 'error',
            });
        }
    };

    useEffect(() => {
        if (settings.FiatCurrency && !loadingSettings && !selectedCurrency) {
            setSelectedCurrency(settings.FiatCurrency);
        }
    }, [loadingSettings, selectedCurrency, settings.FiatCurrency]);

    return {
        currencies,
        loadingCurrencies,

        selectedCurrency,
        setSelectedCurrency,

        walletName,
        handleWalletNameChange,

        mnemonic,
        mnemonicError,
        handleMnemonicChange,

        passphrase,
        handlePassphraseChange,

        confirmedPassphrase,
        handleConfirmedPassphraseChange,

        error,

        loadingWalletSubmit,
        onWalletSubmit: (...args: Parameters<typeof onWalletSubmit>) => {
            if (passphrase !== confirmedPassphrase) {
                setError(c('Error').t`The passphrases do not match`);
                return;
            }

            void withLoadingWalletSubmit(onWalletSubmit(...args));
        },
    };
};
