import { useCallback, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { noop } from 'lodash';
import { c } from 'ttag';

import {
    WasmApiEmailAddress,
    WasmDerivationPath,
    WasmFiatCurrencySymbol,
    WasmMnemonic,
    WasmWallet,
} from '@proton/andromeda';
import { useAddresses, useNotifications, useUserKeys } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import {
    DEFAULT_ACCOUNT_LABEL,
    DEFAULT_SCRIPT_TYPE,
    FIRST_INDEX,
    WalletType,
    encryptWalletData,
    getDefaultWalletName,
    useUserWalletSettings,
    useWalletApiClients,
    walletCreation,
    wordCountToNumber
} from '@proton/wallet';

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

interface Props {
    /**
     * Called when wallet setup is finished without any wallet created
     */
    onSetupFinish: () => void;
}

export const useWalletCreation = ({ onSetupFinish }: Props) => {
    const history = useHistory();
    const [settings, loadingSettings] = useUserWalletSettings();

    const [addresses] = useAddresses();

    const { createNotification } = useNotifications();

    const { decryptedApiWalletsData, network } = useBitcoinBlockchainContext();

    const [mnemonicError, setMnemonicError] = useState<string>();
    const [mnemonic, setMnemonic] = useState<string>();
    const [passphrase, setPassphrase] = useState<string>();
    const [confirmedPassphrase, setConfirmedPassphrase] = useState<string>();
    const [error, setError] = useState<string>('');

    const [walletName, setWalletName] = useState<string>('');

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
            [encryptedName, encryptedMnemonic, encryptedFirstAccountLabel],
            [walletKey, walletKeySignature, userKeyId],
        ] = await encryptWalletData([compelledWalletName, mnemonicStr, DEFAULT_ACCOUNT_LABEL], primaryUserKey);

        const fingerprint = new WasmWallet(network, mnemonicStr, passphrase).getFingerprint();

        if (!encryptedName) {
            return;
        }

        await api.wallet
            .createWallet(
                encryptedName,
                isImported,
                WalletType.OnChain,
                hasPassphrase,
                userKeyId,
                walletKey,
                walletKeySignature,
                encryptedMnemonic,
                fingerprint,
                undefined
            )
            .then(async ({ Wallet, WalletKey, WalletSettings }): Promise<void> => {
                const derivationPath = WasmDerivationPath.fromParts(DEFAULT_SCRIPT_TYPE, network, FIRST_INDEX);

                // Typeguard
                const account = encryptedFirstAccountLabel
                    ? await api.wallet
                          .createWalletAccount(
                              Wallet.ID,
                              derivationPath,
                              encryptedFirstAccountLabel,
                              DEFAULT_SCRIPT_TYPE
                          )
                          .catch(noop)
                    : undefined;

                const addedEmailAddresses: WasmApiEmailAddress[] = [];
                if (account) {
                    await api.wallet.updateWalletAccountFiatCurrency(Wallet.ID, account.Data.ID, selectedCurrency);

                    if (shouldAutoAddEmailAddress) {
                        for (const address of addresses ?? []) {
                            try {
                                await api.wallet.addEmailAddress(Wallet.ID, account.Data.ID, address.ID);
                                addedEmailAddresses.push({ ID: address.ID, Email: address.Email });
                            } catch (e) {}
                        }
                    }
                }

                dispatch(
                    walletCreation({
                        Wallet,
                        WalletKey,
                        WalletSettings,
                        WalletAccounts: account
                            ? [{ ...account.Data, FiatCurrency: selectedCurrency, Addresses: addedEmailAddresses }]
                            : [],
                    })
                );

                history.push(`/wallets/${Wallet.ID}`);
                onSetupFinish();
            })
            .catch(() => {
                createNotification({ text: c('Wallet setup').t`Could not create wallet`, type: 'error' });
            });
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
