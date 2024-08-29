import type { ChangeEvent } from 'react';
import { useEffect } from 'react';

import { c } from 'ttag';

import type { WasmFiatCurrencySymbol } from '@proton/andromeda';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import type { ModalOwnProps } from '@proton/components/components';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    DropdownSizeUnit,
    Icon,
    ModalTwoFooter,
    PasswordInputTwo,
    TextAreaTwo,
    useModalStateWithData,
} from '@proton/components/components';
import { useWalletSettings } from '@proton/wallet';

import { Button, CoreButton, CoreButtonLike, Input, Modal } from '../../atoms';
import { CurrencySelect } from '../../atoms/CurrencySelect';
import { useWalletCreation } from '../../hooks/useWalletCreation';
import type { SubTheme } from '../../utils';
import { getTermAndConditionsSentence } from '../../utils/legal';
import type { WalletInformationalModalOwnProps } from '../WalletInformationalModal';
import { WalletInformationalModal } from '../WalletInformationalModal';

interface Props extends ModalOwnProps {
    theme?: SubTheme;
    walletName?: string;
    currency?: WasmFiatCurrencySymbol;
    isFirstCreation?: boolean;
    onFinish: () => void;
}

export const WalletImportModal = ({
    theme,
    walletName: inputWalletName,
    currency: inputCurrency,
    isFirstCreation,
    onFinish,
    ...modalProps
}: Props) => {
    const [modal, setModal] = useModalStateWithData<WalletInformationalModalOwnProps>();
    const [walletSettings] = useWalletSettings();

    const {
        walletName,
        handleWalletNameChange,
        selectedCurrency,
        setSelectedCurrency,
        passphrase,
        handlePassphraseChange,
        currencies,
        loadingCurrencies,
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

    useEffect(() => {
        if (inputCurrency) {
            setSelectedCurrency(inputCurrency);
        }
    }, [setSelectedCurrency, inputCurrency]);

    useEffect(() => {
        if (inputWalletName) {
            handleWalletNameChange(inputWalletName);
        }
    }, [inputWalletName, handleWalletNameChange]);

    return (
        <>
            <Modal title={c('Wallet setup').t`Import wallet`} className={theme} {...modalProps}>
                <div className="flex flex-column mt-6 gap-1">
                    {!isFirstCreation && (
                        <div>
                            <Input
                                prefix={
                                    <div
                                        className="rounded-full flex p-3"
                                        style={{ background: 'var(--interaction-norm-minor-2)' }}
                                    >
                                        <Icon name="wallet" style={{ color: 'var(--interaction-norm-major-1)' }}></Icon>
                                    </div>
                                }
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
                    )}

                    <div>
                        <CurrencySelect
                            disabled={loadingCurrencies || loadingWalletSubmit}
                            label={c('Wallet preferences').t`Default currency`}
                            placeholder={c('Wallet preferences').t`Select your currency`}
                            value={selectedCurrency}
                            onSelect={(value) => {
                                setSelectedCurrency(value.Symbol);
                            }}
                            options={currencies ?? []}
                            size={{
                                width: DropdownSizeUnit.Anchor,
                                maxWidth: DropdownSizeUnit.Viewport,
                            }}
                        />
                    </div>
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
                        className="mr-auto"
                        shape="underline"
                        color="norm"
                        onClick={() => {
                            setModal({ kind: 'wallet-seedphrase-introduction' });
                        }}
                    >{c('Wallet setup').t`What's a wallet seed phrase?`}</CoreButtonLike>
                </div>
                <Collapsible>
                    <CollapsibleHeader
                        className="color-hint my-3"
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
                            placeholder={c('Placeholder').t`Enter a passphrase or leave empty`}
                        />

                        <CoreButton
                            className="my-3"
                            shape="underline"
                            color="norm"
                            onClick={() => {
                                setModal({ kind: 'wallet-passphrase-introduction' });
                            }}
                        >{c('Wallet setup').t`What's a wallet passphrase?`}</CoreButton>
                    </CollapsibleContent>
                </Collapsible>

                <div className="w-full flex flex-row gap-2">
                    <Button
                        fullWidth
                        className="block mt-2"
                        size="large"
                        shape="solid"
                        color="norm"
                        disabled={loadingWalletSubmit}
                        onClick={() => {
                            void onWalletSubmit({ isFirstCreation, isImported: true });
                        }}
                    >
                        {c('Wallet setup').t`Import`}
                        {loadingWalletSubmit && <CircleLoader className="ml-2" />}
                    </Button>
                </div>
                <ModalTwoFooter className="prompt-footer">
                    {walletSettings?.AcceptTermsAndConditions ? undefined : (
                        <p className="color-weak text-break text-center text-sm">{getTermAndConditionsSentence()}</p>
                    )}
                </ModalTwoFooter>
            </Modal>

            {modal.data && <WalletInformationalModal kind={modal.data.kind} {...modal} />}
        </>
    );
};
