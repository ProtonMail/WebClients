import { useMemo } from 'react';

import { c } from 'ttag';

import { ModalOwnProps } from '@proton/components/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { Modal } from '../../atoms';
import { useWalletSetup } from '../../hooks/useWalletSetup';
import { SchemeAndData, WalletSetupStep } from '../../hooks/useWalletSetup/type';
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
            return [
                <SetupModeSelect onModeSelection={(mode) => onSetupSchemeChange(mode)} />,
                c('Wallet setup').t`Setup your new wallet`,
                c('Wallet setup').t`Get started and create a brand new wallet or import an existing one.`,
            ];
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
                    c('Wallet setup').t`Input your mnemonic`,
                    c('Wallet setup')
                        .t`We will encrypt it and store on our server, then you'll be able to get it on any platform you're logged in`,
                ];
            case WalletSetupStep.MnemonicBackup:
                const m = schemeAndData && 'mnemonic' in schemeAndData ? schemeAndData.mnemonic : mnemonic;
                return [
                    m ? <MnemonicBackup mnemonic={m} onContinue={onNextStep} /> : null,
                    c('Wallet setup').t`Backup your mnemonic`,
                    c('Wallet setup')
                        .t`This is your secret recovery phrase. If you lose access to your account, this phrase will let you recover your wallet.`,
                ];
            case WalletSetupStep.PassphraseInput:
                return [
                    <PassphraseInput onContinue={onPassphraseInput} />,
                    c('Wallet setup').t`Your passphrase (optional)`,
                    c('Wallet setup')
                        .t`For additional security you can use a passphrase, but you'll need it to access your wallet. \nIt won't be stored in your ${BRAND_NAME} account.`,
                ];
            case WalletSetupStep.Settings:
            default:
                return [
                    <WalletSettings onContinue={onWalletSubmit} />,
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
