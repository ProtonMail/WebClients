import { ChangeEvent, useEffect } from 'react';

import { c } from 'ttag';

import { WasmMnemonic, WasmWordCount } from '@proton/andromeda';
import { Href } from '@proton/atoms/Href';
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

import { Button, CoreButtonLike, Input, Modal, Select } from '../../atoms';
import { useWalletCreation } from '../../hooks/useWalletCreation';
import { SubTheme } from '../../utils';
import { WalletImportModal } from '../WalletImportModal';

export interface WalletCreationModalOwnProps {
    theme?: SubTheme;
    isFirstCreation?: boolean;
}

type Props = ModalOwnProps & WalletCreationModalOwnProps;

export const WalletCreationModal = ({ theme, isFirstCreation, ...modalProps }: Props) => {
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
                subline={c('Wallet setup').t`Choose your local fiat currency to see the value of your transactions.`}
                className={theme}
                hasClose={!isFirstCreation}
                {...modalProps}
            >
                <div className="flex flex-column">
                    {!isFirstCreation && (
                        <div className="mb-4">
                            <Input
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
                        <Select
                            disabled={loadingCurrencies || loadingWalletSubmit}
                            label="Local currency"
                            value={selectedCurrency}
                            onChange={(event) => {
                                setSelectedCurrency(event.value);
                            }}
                            options={
                                currencies?.map((currency) => ({
                                    label: currency.Symbol.toString(),
                                    value: currency.Symbol,
                                    id: currency.Symbol.toString(),
                                })) ?? []
                            }
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

                            <CoreButtonLike
                                className="my-3"
                                as={Href}
                                target="_blank"
                                shape="underline"
                                color="norm"
                            >{c('Wallet setup').t`What's a wallet passphrase`}</CoreButtonLike>
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
                isFirstCreation={isFirstCreation}
                {...walletImportModal}
                onFinish={onSetupFinish}
            />
        </>
    );
};
