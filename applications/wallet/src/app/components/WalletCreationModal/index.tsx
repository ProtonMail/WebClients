import { useMemo } from 'react';

import { c } from 'ttag';

import { ModalOwnProps } from '@proton/components/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { Modal } from '../../atoms';
import { useWalletSetup } from '../../hooks/useWalletSetup';
import { SchemeAndData, WalletSetupScheme, WalletSetupStep } from '../../hooks/useWalletSetup/type';
import { MnemonicBackup, MnemonicInput, PassphraseInput, SetupModeSelect } from './steps';
import { MnemonicBackupOnboarding } from './steps/MnemonicBackupOnboarding';
import { WalletSettings } from './steps/WalletSettings';

interface Props extends ModalOwnProps {
    schemeAndData?: SchemeAndData;
}

export const WalletCreationModal = ({ schemeAndData, ...modalProps }: Props) => {
    const { mnemonic, step, onSetupSchemeChange, onNextStep, onPassphraseInput, onWalletSubmit, onMnemonicInput } =
        useWalletSetup({
            schemeAndData,
            onSetupFinish: () => {
                modalProps.onClose?.();
            },
        });

    const [content, title, subline] = useMemo(() => {
        if (!step) {
            return [<SetupModeSelect onModeSelection={(mode) => onSetupSchemeChange(mode)} />];
        }

        switch (step) {
            case WalletSetupStep.Intro:
                return [
                    <MnemonicBackupOnboarding onViewMnemonic={onNextStep} />,
                    c('Wallet setup').t`Your keys, your coins.`,
                ];

            case WalletSetupStep.MnemonicInput:
                return [
                    <MnemonicInput onContinue={onMnemonicInput} />,
                    c('Wallet setup').t`Import Wallet`,
                    c('Wallet setup').t`Import or restore an existing wallet`,
                ];
            case WalletSetupStep.MnemonicBackup:
                const m = schemeAndData && 'mnemonic' in schemeAndData ? schemeAndData.mnemonic : mnemonic;
                return [
                    m ? <MnemonicBackup mnemonic={m} onContinue={onNextStep} /> : null,
                    c('Wallet setup').t`Wallet seed phrase`,
                    c('Wallet setup')
                        .t`Use this secret recovery phrase to recover your wallet if you lose access to your account.`,
                ];
            case WalletSetupStep.PassphraseInput:
                return [
                    <PassphraseInput onContinue={onPassphraseInput} />,
                    c('Wallet setup').t`Your passphrase`,
                    c('Wallet setup')
                        .t`Enhance your wallet's security with a passphrase. Please note that it will not be stored in your ${BRAND_NAME} account.`,
                ];
            case WalletSetupStep.Settings:
            default:
                return [
                    <WalletSettings
                        isImported={schemeAndData?.scheme === WalletSetupScheme.WalletImport}
                        onContinue={onWalletSubmit}
                    />,
                    c('Wallet setup').t`Almost done`,
                    c('Wallet setup').t`Give a name to your wallet and set your preferred currency`,
                ];
        }
    }, [
        step,
        mnemonic,
        onMnemonicInput,
        onNextStep,
        onPassphraseInput,
        onSetupSchemeChange,
        onWalletSubmit,
        schemeAndData,
    ]);

    return (
        <Modal title={title} subline={subline} enableCloseWhenClickOutside {...modalProps}>
            {content}
        </Modal>
    );
};
