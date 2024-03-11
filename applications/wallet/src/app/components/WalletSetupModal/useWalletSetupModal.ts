import { useEffect, useState } from 'react';

import { noop } from 'lodash';
import { c } from 'ttag';

import { WasmDerivationPath, WasmMnemonic, WasmWallet } from '@proton/andromeda';
import { useNotifications, useUserKeys } from '@proton/components/hooks';
import { useWalletApi } from '@proton/wallet';

import { DEFAULT_ACCOUNT_LABEL, DEFAULT_SCRIPT_TYPE, purposeByScriptType } from '../../constants';
import { useBitcoinBlockchainContext } from '../../contexts';
import { useWalletDispatch } from '../../store/hooks';
import { walletCreation } from '../../store/slices/apiWalletsData';
import { WalletType } from '../../types';
import { encryptWalletData } from '../../utils/crypto';
import { walletCreationSetupSteps, walletImportSetupSteps } from './constants';
import { WalletSetupMode, WalletSetupStep } from './type';

interface Props {
    onSetupFinish: () => void;
    isOpen: boolean;
}

const getSetupSteps = (mode: WalletSetupMode) =>
    mode === WalletSetupMode.Creation ? walletCreationSetupSteps : walletImportSetupSteps;

export const useWalletSetupModal = ({ onSetupFinish, isOpen }: Props) => {
    const { createNotification } = useNotifications();

    const { network } = useBitcoinBlockchainContext();

    const [mnemonic, setMnemonic] = useState<WasmMnemonic>();
    const [passphrase, setPassphrase] = useState<string>();
    const [walletName, setWalletName] = useState<string>('');
    const [fingerprint, setFingerprint] = useState<string>();
    const [setupMode, setSetupMode] = useState<WalletSetupMode>();
    const [walletId, setWalletId] = useState<string>();
    const [currentStep, setCurrentStep] = useState<WalletSetupStep>(WalletSetupStep.SetupModeChoice);

    const [userKeys] = useUserKeys();

    const api = useWalletApi();
    const dispatch = useWalletDispatch();

    const onNextStep = () => {
        if (!setupMode) {
            return setCurrentStep(WalletSetupStep.SetupModeChoice);
        }

        const steps = getSetupSteps(setupMode);
        const currentStepIndex = steps.findIndex((step) => step === currentStep);

        const isLastStep = currentStepIndex === steps.length - 1;

        if (isLastStep) {
            return onSetupFinish();
        }

        setCurrentStep(steps[currentStepIndex + 1]);
    };

    const onSelectSetupMode = (mode: WalletSetupMode) => {
        const [firstStep] = getSetupSteps(mode);

        setSetupMode(mode);
        setCurrentStep(firstStep);
    };

    const onMnemonicInput = (mnemonic: WasmMnemonic) => {
        setMnemonic(mnemonic);
        onNextStep();
    };

    const onMnemonicGenerated = (mnemonic: WasmMnemonic) => {
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
        if (!userKeys || !network) {
            return;
        }

        const [primaryUserKey] = userKeys;

        const isImported = setupMode === WalletSetupMode.Import;
        const hasPassphrase = !!passphrase;

        // TODO: add public key support here
        const [[encryptedMnemonic, encryptedFirstAccountLabel], [walletKey, userKeyId]] = await encryptWalletData(
            [mnemonic?.asString(), DEFAULT_ACCOUNT_LABEL],
            primaryUserKey
        );

        const fingerprint = mnemonic && new WasmWallet(network, mnemonic.asString(), passphrase).getFingerprint();

        setFingerprint(fingerprint);

        await api
            .wallet()
            .createWallet(
                walletName,
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
                setWalletId(Wallet.ID);

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

                // TODO: Account detection for imported wallets

                dispatch(
                    walletCreation({
                        Wallet,
                        WalletKey,
                        WalletSettings,
                        WalletAccounts: account ? [account.Account] : [],
                    })
                );
            })
            .catch(() => {
                createNotification({ text: c('Wallet setup').t`Could not create wallet`, type: 'error' });
            });

        setWalletName(walletName);
        onNextStep();
    };

    const clear = () => {
        setMnemonic(undefined);
        setSetupMode(undefined);
        setCurrentStep(WalletSetupStep.SetupModeChoice);
    };

    useEffect(() => {
        if (!isOpen) {
            clear();
        }
    }, [isOpen]);

    return {
        onSelectSetupMode,
        onMnemonicGenerated,
        onMnemonicInput,
        onNextStep,
        setMnemonic,
        onPassphraseInput,
        onWalletSubmit,
        clear,
        walletName,
        currentStep,
        setupMode,
        mnemonic,
        passphrase,
        fingerprint,
        walletId,
    };
};
