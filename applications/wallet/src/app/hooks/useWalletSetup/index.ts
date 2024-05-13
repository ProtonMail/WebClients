import { useState } from 'react';
import { useHistory } from 'react-router-dom';

import { noop } from 'lodash';
import { c } from 'ttag';

import { WasmDerivationPath, WasmMnemonic, WasmWallet, WasmWordCount } from '@proton/andromeda';
import { useNotifications, useUserKeys } from '@proton/components/hooks';
import { encryptWalletData } from '@proton/wallet';
import { WalletType, useWalletApi, walletCreation } from '@proton/wallet';

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
        case WalletSetupScheme.WalletAutocreationBackup:
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
    const [schemeAndData, setSchemeAndData] = useState<SchemeAndData | undefined>(initSchemeAndData);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const history = useHistory();

    const { createNotification } = useNotifications();

    const { network } = useBitcoinBlockchainContext();

    const [mnemonic, setMnemonic] = useState<WasmMnemonic>(new WasmMnemonic(WasmWordCount.Words12));
    const [passphrase, setPassphrase] = useState<string>();

    const [userKeys] = useUserKeys();

    const api = useWalletApi();
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const onWalletSubmit = async (walletName: string, _fiatCurrency: string) => {
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

        await api
            .wallet()
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
                    ? await api
                          .wallet()
                          .createWalletAccount(
                              Wallet.ID,
                              derivationPath,
                              encryptedFirstAccountLabel,
                              DEFAULT_SCRIPT_TYPE
                          )
                          .catch(noop)
                    : undefined;

                dispatch(
                    walletCreation({
                        Wallet,
                        WalletKey,
                        WalletSettings,
                        WalletAccounts: account ? [account.Data] : [],
                    })
                );

                // workaround because dispatch is not sync but doesn't return Promise neither
                // await wait(2000);
                history.push(`/wallets/${Wallet.ID}`);

                onSetupFinish();
            })
            .catch(() => {
                createNotification({ text: c('Wallet setup').t`Could not create wallet`, type: 'error' });
            });

        onNextStep();
    };

    return {
        step: steps?.[currentStepIndex],
        mnemonic,
        schemeAndData,
        onSetupSchemeChange,
        onNextStep,
        onPassphraseInput,
        onWalletSubmit,
        onMnemonicInput,
    };
};
