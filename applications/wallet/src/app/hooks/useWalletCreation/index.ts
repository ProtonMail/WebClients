import { useCallback, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import first from 'lodash/first';
import { c } from 'ttag';

import type {
    WasmApiEmailAddress,
    WasmApiWalletAccount,
    WasmFiatCurrencySymbol,
    WasmNetwork,
    WasmProtonWalletApiClient,
    WasmScriptType,
} from '@proton/andromeda';
import { WasmAccount, WasmDerivationPath, WasmMnemonic, WasmWallet } from '@proton/andromeda';
import { useAddresses, useNotifications, useOrganization, useUserKeys } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import {
    DEFAULT_FIRST_ACCOUNT_INDEX,
    DEFAULT_FIRST_ACCOUNT_LABEL,
    DEFAULT_FIRST_BVE_ACCOUNT_INDEX,
    DEFAULT_FIRST_BVE_ACCOUNT_LABEL,
    DEFAULT_SCRIPT_TYPE,
    WalletType,
    acceptTermsAndConditions,
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
    shouldAddBveAccount,
}: {
    isImported: boolean;
    wasmWallet: WasmWallet;
    walletApi: WasmProtonWalletApiClient;
    decryptedWalletKey: CryptoKey;
    network: WasmNetwork;
    shouldAddBveAccount?: boolean;
}): Promise<[boolean, WasmDerivationPath, string, WasmScriptType][]> => {
    if (isImported) {
        const shouldDoBve = false;
        const discoveredAccounts = await wasmWallet.discoverAccounts(walletApi);

        const encryptedLabels = await encryptWalletDataWithWalletKey(
            new Array(discoveredAccounts.data.length).fill('').map((a, index) => `Wallet account ${index}`),
            decryptedWalletKey
        );

        const accountsToCreate = discoveredAccounts.data.map((account, index) => {
            const args: [boolean, WasmDerivationPath, string, WasmScriptType] = [
                shouldDoBve,
                account[2],
                encryptedLabels[index],
                account[0],
            ];

            return args;
        });

        if (accountsToCreate.length) {
            return accountsToCreate;
        }
    }

    const firstAccountDerivationPath = WasmDerivationPath.fromParts(
        DEFAULT_SCRIPT_TYPE,
        network,
        DEFAULT_FIRST_ACCOUNT_INDEX
    );
    const bveAccountDerivationPath = WasmDerivationPath.fromParts(
        DEFAULT_SCRIPT_TYPE,
        network,
        DEFAULT_FIRST_BVE_ACCOUNT_INDEX
    );

    const [encryptedFirstAccountLabel, encryptedBvEAccountLabel] = await encryptWalletDataWithWalletKey(
        [DEFAULT_FIRST_ACCOUNT_LABEL, DEFAULT_FIRST_BVE_ACCOUNT_LABEL],
        decryptedWalletKey
    );

    const firstAccountData: [boolean, WasmDerivationPath, string, WasmScriptType] = [
        false,
        firstAccountDerivationPath,
        encryptedFirstAccountLabel,
        DEFAULT_SCRIPT_TYPE,
    ];

    const bveAccountData: [boolean, WasmDerivationPath, string, WasmScriptType] = [
        true,
        bveAccountDerivationPath,
        encryptedBvEAccountLabel,
        DEFAULT_SCRIPT_TYPE,
    ];

    return [firstAccountData, ...(shouldAddBveAccount ? [bveAccountData] : [])];
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

    const { decryptedApiWalletsData, network, manageBitcoinAddressPool } = useBitcoinBlockchainContext();

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

    const doesWalletAlreadyExist = useCallback(
        (mnemonicStr: string, network: WasmNetwork) => {
            const wasmWallet = new WasmWallet(network, mnemonicStr, passphrase);
            const fingerprint = wasmWallet.getFingerprint();

            return Boolean(decryptedApiWalletsData?.some((w) => w.Wallet.Fingerprint === fingerprint));
        },
        [decryptedApiWalletsData, passphrase]
    );

    useEffect(() => {
        if (mnemonicError && network) {
            const result = parseMnemonic(mnemonic);

            if ('error' in result) {
                return setMnemonicError(result.error);
            }

            const mnemonicStr = result.mnemonic.asString();

            if (doesWalletAlreadyExist(mnemonicStr, network)) {
                return setMnemonicError(c('Wallet import').t`A wallet with same fingerprint already exists`);
            }

            return setMnemonicError(undefined);
        }
    }, [mnemonicError, mnemonic, network, doesWalletAlreadyExist]);

    const onWalletSubmit = async ({
        isFirstCreation,
        isImported = false,
    }: {
        isFirstCreation?: boolean;
        isImported?: boolean;
    }) => {
        // Typeguard
        if (!userKeys || isUndefined(network) || !selectedCurrency) {
            return;
        }

        if (passphrase !== confirmedPassphrase) {
            setError(c('Error').t`The passphrases do not match`);
            return;
        }

        const result = parseMnemonic(mnemonic);

        if ('error' in result) {
            setMnemonicError(result.error);
            return;
        }

        const mnemonicStr = result.mnemonic.asString();
        const wasmWallet = new WasmWallet(network, mnemonicStr, passphrase);
        const fingerprint = wasmWallet.getFingerprint();

        if (doesWalletAlreadyExist(mnemonicStr, network)) {
            setMnemonicError(c('Wallet import').t`A wallet with same fingerprint already exists`);
            return;
        }

        const [primaryUserKey] = userKeys;

        const hasPassphrase = !!passphrase;
        const compelledWalletName = walletName || getDefaultWalletName(isImported, decryptedApiWalletsData ?? []);

        // TODO: add public key support here
        const [
            [encryptedName, encryptedMnemonic],
            [encryptedWalletKey, walletKeySignature, decryptedWalletKey, userKeyId],
        ] = await encryptWalletData([compelledWalletName, mnemonicStr], primaryUserKey);

        try {
            const accounts = await getWalletAccountsToCreate({
                isImported,
                walletApi,
                decryptedWalletKey,
                network,
                wasmWallet,
                shouldAddBveAccount: isFirstCreation,
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

            const createdAccounts: WasmApiWalletAccount[] = [];
            const firstAddress = first(addresses);

            for (const [shouldDoBve, ...account] of accountsWithinUserLimit) {
                const created = await api.wallet.createWalletAccount(Wallet.ID, ...account).catch((error: any) => {
                    createNotification({
                        text: error?.error ?? c('Wallet setup').t`Could not create wallet account`,
                        type: 'error',
                    });

                    return null;
                });

                if (created) {
                    try {
                        await api.wallet.updateWalletAccountFiatCurrency(Wallet.ID, created.Data.ID, selectedCurrency);
                    } catch {
                        // Silent handling
                    }

                    let addedEmailAddresses: WasmApiEmailAddress[] = [];

                    // We cannot link an email address to several wallet accounts
                    const hasAlreadyLinkedFirstEmail = createdAccounts.some((a) => a.Addresses.length);

                    if (shouldDoBve && firstAddress && !hasAlreadyLinkedFirstEmail) {
                        try {
                            await api.wallet.addEmailAddress(Wallet.ID, created.Data.ID, firstAddress.ID);
                            addedEmailAddresses = [{ ID: firstAddress.ID, Email: firstAddress.Email }];

                            const { DerivationPath, ScriptType } = created.Data;

                            const derivationPath = new WasmDerivationPath(DerivationPath);
                            const wasmAccount = new WasmAccount(wasmWallet, ScriptType, derivationPath);

                            void manageBitcoinAddressPool({
                                wallet: wallet.Wallet,
                                account: {
                                    ...created.Data,
                                    FiatCurrency: selectedCurrency,
                                    Addresses: addedEmailAddresses,
                                },
                                accountChainData: {
                                    account: wasmAccount,
                                    scriptType: ScriptType,
                                    derivationPath: DerivationPath,
                                },
                            });
                        } catch (error: any) {
                            createNotification({
                                text: error?.error ?? c('Wallet setup').t`Could not link email to wallet account`,
                                type: 'error',
                            });
                        }
                    }

                    const walletAccount = {
                        ...created.Data,
                        FiatCurrency: selectedCurrency,
                        Addresses: addedEmailAddresses,
                    };

                    createdAccounts.push(walletAccount);
                }
            }

            dispatch(
                walletCreation({
                    Wallet,
                    WalletKey,
                    WalletSettings,
                    WalletAccounts: createdAccounts,
                })
            );

            if (isFirstCreation) {
                createNotification({ text: c('Wallet terms and conditions').t`Terms and conditions were accepted` });
                dispatch(acceptTermsAndConditions());
            }

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
            void withLoadingWalletSubmit(onWalletSubmit(...args));
        },
    };
};
