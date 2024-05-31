import { ChangeEvent } from 'react';

import { c } from 'ttag';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
    ModalOwnProps,
    PasswordInputTwo,
    TextAreaTwo,
    useModalStateWithData,
} from '@proton/components/components';

import { Button, CoreButton, CoreButtonLike, Input, Modal } from '../../atoms';
import { useWalletCreation } from '../../hooks/useWalletCreation';
import { SubTheme } from '../../utils';
import { WalletInformationalModal, WalletInformationalModalOwnProps } from '../WalletInformationalModal';

interface Props extends ModalOwnProps {
    theme?: SubTheme;
    isFirstCreation?: boolean;
    onFinish: () => void;
}

export const WalletImportModal = ({ theme, isFirstCreation, onFinish, ...modalProps }: Props) => {
    const [modal, setModal] = useModalStateWithData<WalletInformationalModalOwnProps>();

    const {
        walletName,
        handleWalletNameChange,
        passphrase,
        handlePassphraseChange,
        mnemonic,
        mnemonicError,
        handleMnemonicChange,
        loadingWalletSubmit,
        onWalletSubmit,
    } = useWalletCreation({
        onSetupFinish: () => {
            modalProps.onClose?.();
            onFinish();
        },
    });

    return (
        <>
            <Modal title={c('Wallet setup').t`Import wallet`} className={theme} {...modalProps}>
                <div className="flex flex-column">
                    <div className="mb-4">
                        <Input
                            label={c('Wallet setup').t`Name`}
                            id="wallet-name-input"
                            placeholder={c('Wallet setup').t`Give a name to this wallet`}
                            value={walletName}
                            disabled={loadingWalletSubmit}
                            onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                handleWalletNameChange(event.target.value);
                            }}
                        />
                    </div>
                </div>

                <div className="flex flex-column my-3">
                    <Input
                        as={TextAreaTwo}
                        rows={3}
                        label={c('Wallet setup').t`Seed phrase (12-24 words)`}
                        value={mnemonic}
                        onValue={(v: string) => handleMnemonicChange(v)}
                        className="bg-weak"
                        error={mnemonicError}
                    />

                    <CoreButtonLike
                        className="mr-auto my-3"
                        shape="underline"
                        color="norm"
                        onClick={() => {
                            setModal({ kind: 'wallet-seedphrase-introduction' });
                        }}
                    >{c('Wallet setup').t`What's a wallet seed phrase`}</CoreButtonLike>
                </div>

                <Collapsible className="mb-4">
                    <CollapsibleHeader
                        className="mb-4"
                        suffix={
                            <CollapsibleHeaderIconButton>
                                <Icon name="chevron-down" />
                            </CollapsibleHeaderIconButton>
                        }
                    >{c('Wallet setup').t`My wallet had a passphrase`}</CollapsibleHeader>
                    <CollapsibleContent>
                        <Input
                            autoFocus
                            id="passphrase"
                            as={PasswordInputTwo}
                            value={passphrase}
                            disabled={loadingWalletSubmit}
                            onValue={handlePassphraseChange}
                            label={c('Wallet setup').t`Passphrase`}
                            placeholder={c('Placeholder').t`Leave empty if you don't want to add passphrase`}
                        />

                        <CoreButton
                            className="my-3"
                            shape="underline"
                            color="norm"
                            onClick={() => {
                                setModal({ kind: 'wallet-passphrase-introduction' });
                            }}
                        >{c('Wallet setup').t`What's a wallet passphrase`}</CoreButton>
                    </CollapsibleContent>
                </Collapsible>

                <div className="w-full flex mt-6">
                    <Button
                        fullWidth
                        className="block mb-2"
                        size="large"
                        shape="solid"
                        color="norm"
                        disabled={loadingWalletSubmit}
                        onClick={() => {
                            void onWalletSubmit({ shouldAutoAddEmailAddress: isFirstCreation, isImported: true });
                        }}
                    >{c('Wallet setup').t`Import`}</Button>
                </div>
            </Modal>

            {modal.data && <WalletInformationalModal kind={modal.data.kind} {...modal} />}
        </>
    );
};
