import { useEffect, useState } from 'react';

import { noop } from 'lodash';
import { c } from 'ttag';

import { useEventManager, useNotifications, useUserKeys } from '@proton/components/hooks';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { DecryptedKey } from '@proton/shared/lib/interfaces';

import { WasmDerivationPath, WasmMnemonic, WasmWallet } from '../../../pkg';
import { DEFAULT_ACCOUNT_LABEL, DEFAULT_SCRIPT_TYPE, purposeByScriptType } from '../../constants';
import { useOnchainWalletContext, useRustApi } from '../../contexts';
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

    const { network } = useOnchainWalletContext();

    const [mnemonic, setMnemonic] = useState<WasmMnemonic>();
    const [passphrase, setPassphrase] = useState<string>();
    const [walletName, setWalletName] = useState<string>('');
    const [fingerprint, setFingerprint] = useState<string>();
    const [setupMode, setSetupMode] = useState<WalletSetupMode>();
    const [walletId, setWalletId] = useState<string>();
    const [currentStep, setCurrentStep] = useState<WalletSetupStep>(WalletSetupStep.SetupModeChoice);

    const [userKeys] = useUserKeys();

    const api = useRustApi();
    const { call } = useEventManager();

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
        await waitUntil(() => !!userKeys, 10);

        const [primaryUserKey] = userKeys as DecryptedKey[];

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
            .then(async (walletData): Promise<void> => {
                setWalletId(walletData.Wallet.ID);

                const derivationPath = WasmDerivationPath.fromParts(
                    purposeByScriptType[DEFAULT_SCRIPT_TYPE],
                    network,
                    0
                );

                // Typeguard
                if (encryptedFirstAccountLabel) {
                    await api
                        .wallet()
                        .createWalletAccount(
                            walletData.Wallet.ID,
                            derivationPath,
                            encryptedFirstAccountLabel,
                            DEFAULT_SCRIPT_TYPE
                        )
                        .catch(noop);
                }

                // TODO: Account detection for imported wallets

                await call();
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
