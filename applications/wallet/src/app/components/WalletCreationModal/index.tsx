import { ChangeEvent, useEffect } from 'react';

import { c } from 'ttag';

import { WasmMnemonic, WasmWordCount } from '@proton/andromeda';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
    ModalOwnProps,
    PasswordInputTwo,
    useModalState,
} from '@proton/components/components';

import { Button, CoreButton, Input, Modal } from '../../atoms';
import { CurrencySelect } from '../../atoms/CurrencySelect';
import { useWalletCreation } from '../../hooks/useWalletCreation';
import { SubTheme } from '../../utils';
import { WalletImportModal } from '../WalletImportModal';
import { WalletInformationalModal } from '../WalletInformationalModal';

export interface WalletCreationModalOwnProps {
    theme?: SubTheme;
    isFirstCreation?: boolean;
}

type Props = ModalOwnProps & WalletCreationModalOwnProps;

export const WalletCreationModal = ({ theme, isFirstCreation, ...modalProps }: Props) => {
    const [walletInfoModal, setWalletInfoModal] = useModalState();
    const [walletImportModal, setWalletImportModal] = useModalState();

    const onSetupFinish = () => {
        modalProps.onClose?.();
    };

    const {
        walletName,
        handleWalletNameChange,
        handleMnemonicChange,
        passphrase,
        handlePassphraseChange,
        loadingCurrencies,
        currencies,
        selectedCurrency,
        setSelectedCurrency,
        loadingWalletSubmit,
        onWalletSubmit,
    } = useWalletCreation({
        onSetupFinish,
    });

    useEffect(() => {
        handleMnemonicChange(new WasmMnemonic(WasmWordCount.Words12).asString());
    }, [handleMnemonicChange]);

    return (
        <>
            <Modal
                title={c('Wallet setup').t`Wallet setup`}
                subline={c('Wallet setup').t`Choose a name and default currency.`}
                className={theme}
                hasClose={!isFirstCreation}
                {...modalProps}
            >
                <div className="flex flex-column">
                    {!isFirstCreation && (
                        <div className="mb-4">
                            <Input
                                prefix={
                                    <div
                                        className="rounded-full flex p-3 mr-4"
                                        style={{ background: 'var(--interaction-norm-minor-2)' }}
                                    >
                                        <Icon name="wallet" style={{ color: 'var(--interaction-norm-major-1)' }}></Icon>
                                    </div>
                                }
                                label={c('Wallet setup').t`Wallet name`}
                                id="wallet-name-input"
                                placeholder={c('Wallet setup').t`Give a name to this wallet`}
                                value={walletName}
                                disabled={loadingWalletSubmit}
                                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                    handleWalletNameChange(event.target.value);
                                }}
                            />
                        </div>
                    )}

                    <div className="mb-4">
                        <CurrencySelect
                            disabled={loadingCurrencies || loadingWalletSubmit}
                            label={c('Wallet preferences').t`Local currency`}
                            placeholder={c('Wallet preferences').t`Select your currency`}
                            value={selectedCurrency}
                            onSelect={(value) => {
                                setSelectedCurrency(value.Symbol);
                            }}
                            options={currencies ?? []}
                        />
                    </div>
                </div>

                {!isFirstCreation && (
                    <Collapsible className="mb-4">
                        <CollapsibleHeader
                            className="mb-4"
                            suffix={
                                <CollapsibleHeaderIconButton>
                                    <Icon name="chevron-down" />
                                </CollapsibleHeaderIconButton>
                            }
                        >{c('Wallet setup').t`Add a passphrase (optional)`}</CollapsibleHeader>
                        <CollapsibleContent>
                            <h3 className="text-center mt-6 mb-2 text-semibold">{c('Wallet setup')
                                .t`Add a passphrase`}</h3>
                            <p className="mt-2 mb-6 color-weak text-center">{c('Wallet setup')
                                .t`A passphrase acts as a second password. It cannot be changed or added later. Back it up safely to unlock your wallet each time you log in.`}</p>

                            <div className="mt-8">
                                <Input
                                    autoFocus
                                    id="passphrase"
                                    as={PasswordInputTwo}
                                    value={passphrase}
                                    disabled={loadingWalletSubmit}
                                    onValue={handlePassphraseChange}
                                    label={c('Wallet setup').t`Passphrase`}
                                    placeholder={c('Placeholder').t`Enter a passphrase or leave empty`}
                                />
                            </div>

                            <CoreButton
                                className="my-3"
                                shape="underline"
                                color="norm"
                                onClick={() => {
                                    setWalletInfoModal(true);
                                }}
                            >{c('Wallet setup').t`Learn more`}</CoreButton>
                        </CollapsibleContent>
                    </Collapsible>
                )}

                <div className="w-full flex flex-column mt-4">
                    <div className="flex">
                        <Button
                            fullWidth
                            className="block mb-2"
                            size="large"
                            shape="solid"
                            color="norm"
                            disabled={loadingWalletSubmit}
                            onClick={() => {
                                void onWalletSubmit({ shouldAutoAddEmailAddress: isFirstCreation });
                            }}
                        >{c('Wallet setup').t`Create a new wallet`}</Button>
                        <Button
                            fullWidth
                            className="block text-semibold"
                            size="large"
                            shape="solid"
                            color="weak"
                            disabled={loadingWalletSubmit}
                            onClick={() => {
                                setWalletImportModal(true);
                            }}
                        >{c('Wallet setup').t`Import wallet`}</Button>
                    </div>
                </div>
            </Modal>

            <WalletImportModal
                theme={theme}
                walletName={walletName}
                currency={selectedCurrency}
                isFirstCreation={isFirstCreation}
                {...walletImportModal}
                onFinish={onSetupFinish}
            />

            <WalletInformationalModal kind="wallet-passphrase-introduction" {...walletInfoModal} />
        </>
    );
};
