import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { noop } from 'lodash';
import { c } from 'ttag';

import {
    WasmApiEmailAddress,
    WasmDerivationPath,
    WasmFiatCurrencySymbol,
    WasmMnemonic,
    WasmWallet,
    WasmWordCount,
} from '@proton/andromeda';
import { useAddresses, useNotifications, useUserKeys } from '@proton/components/hooks';
import usePrevious from '@proton/hooks/usePrevious';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { encryptWalletData } from '@proton/wallet';
import { WalletType, useWalletApiClients, walletCreation } from '@proton/wallet';

import { DEFAULT_ACCOUNT_LABEL, DEFAULT_SCRIPT_TYPE, purposeByScriptType } from '../../constants';
import { useBitcoinBlockchainContext } from '../../contexts';
import { useWalletDispatch } from '../../store/hooks';
import { SchemeAndData, WalletSetupScheme, WalletSetupStep } from './type';

const getSetupStepsFromScheme = (scheme?: WalletSetupScheme): WalletSetupStep[] | null => {
    if (!scheme) {
        return null;
    }

    switch (scheme) {
        case WalletSetupScheme.ManualCreation:
            return [WalletSetupStep.MnemonicBackup, WalletSetupStep.PassphraseInput, WalletSetupStep.Settings];
        case WalletSetupScheme.WalletImport:
            return [WalletSetupStep.MnemonicInput, WalletSetupStep.PassphraseInput, WalletSetupStep.Settings];
        case WalletSetupScheme.WalletAutocreationFinalize:
            return [WalletSetupStep.Settings];
        case WalletSetupScheme.WalletBackup:
            return [WalletSetupStep.Intro, WalletSetupStep.MnemonicBackup];
    }
};

interface Props {
    schemeAndData?: SchemeAndData;
    /**
     * Called when wallet setup is finished without any wallet created
     */
    onSetupFinish: () => void;
}

export const useWalletSetup = ({ schemeAndData: initSchemeAndData, onSetupFinish }: Props) => {
    const [schemeAndData, setSchemeAndData] = useState<SchemeAndData>();
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const history = useHistory();

    const prevSchemeAndData = usePrevious(schemeAndData);

    const [addresses] = useAddresses();

    useEffect(() => {
        if (initSchemeAndData && !isDeepEqual(prevSchemeAndData, initSchemeAndData)) {
            setSchemeAndData(initSchemeAndData);
        }
    }, [initSchemeAndData, prevSchemeAndData]);

    const { createNotification } = useNotifications();

    const { network } = useBitcoinBlockchainContext();

    const [mnemonic, setMnemonic] = useState<WasmMnemonic>(new WasmMnemonic(WasmWordCount.Words12));
    const [passphrase, setPassphrase] = useState<string>();

    const [userKeys] = useUserKeys();

    const api = useWalletApiClients();
    const dispatch = useWalletDispatch();

    const steps = getSetupStepsFromScheme(schemeAndData?.scheme);

    const onNextStep = () => {
        if (!schemeAndData) {
            return setCurrentStepIndex(0);
        }

        const isLastStep = steps && currentStepIndex === steps.length - 1;

        if (isLastStep) {
            return onSetupFinish();
        }

        setCurrentStepIndex(currentStepIndex + 1);
    };

    const onSetupSchemeChange = (scheme: WalletSetupScheme.ManualCreation | WalletSetupScheme.WalletImport) => {
        setSchemeAndData({ scheme });
        setCurrentStepIndex(0);
    };

    const onMnemonicInput = (mnemonic: WasmMnemonic) => {
        setMnemonic(mnemonic);
        onNextStep();
    };

    const onPassphraseInput = (passphrase: string) => {
        setPassphrase(passphrase);
        onNextStep();
    };

    // TODO: use fiatCurrency later
    const onWalletSubmit = async (walletName: string, fiatCurrency: WasmFiatCurrencySymbol) => {
        // Typeguard
        if (!userKeys || !network || !schemeAndData) {
            return;
        }

        const [primaryUserKey] = userKeys;

        const isImported = schemeAndData.scheme === WalletSetupScheme.WalletImport;
        const hasPassphrase = !!passphrase;

        // TODO: add public key support here
        const [[encryptedName, encryptedMnemonic, encryptedFirstAccountLabel], [walletKey, userKeyId]] =
            await encryptWalletData([walletName, mnemonic.asString(), DEFAULT_ACCOUNT_LABEL], primaryUserKey);

        const fingerprint = new WasmWallet(network, mnemonic.asString(), passphrase).getFingerprint();

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
                encryptedMnemonic,
                fingerprint,
                undefined
            )
            .then(async ({ Wallet, WalletKey, WalletSettings }): Promise<void> => {
                const derivationPath = WasmDerivationPath.fromParts(
                    purposeByScriptType[DEFAULT_SCRIPT_TYPE],
                    network,
                    0
                );

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
                    await api.wallet.updateWalletAccountFiatCurrency(Wallet.ID, account.Data.ID, fiatCurrency);

                    // We enable email integration by default during autocreation
                    if (schemeAndData.scheme === WalletSetupScheme.WalletAutocreationFinalize) {
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
                            ? [{ ...account.Data, FiatCurrency: fiatCurrency, Addresses: addedEmailAddresses }]
                            : [],
                    })
                );

                history.push(`/wallets/${Wallet.ID}`);
                onSetupFinish();
                onNextStep();
            })
            .catch(() => {
                createNotification({ text: c('Wallet setup').t`Could not create wallet`, type: 'error' });
            });
    };

    return {
        step: steps?.[currentStepIndex],
        isLastStep: currentStepIndex >= (steps?.length ?? 0) - 1,
        mnemonic,
        schemeAndData,
        onSetupSchemeChange,
        onNextStep,
        onPassphraseInput,
        onWalletSubmit,
        onMnemonicInput,
    };
};
