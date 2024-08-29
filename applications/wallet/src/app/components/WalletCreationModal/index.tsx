import type { ChangeEvent } from 'react';
import { useEffect } from 'react';

import { c } from 'ttag';

import { WasmMnemonic, WasmWordCount } from '@proton/andromeda';
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
    useModalState,
} from '@proton/components/components';
import { useUserWalletSettings } from '@proton/wallet';

import { Button, CoreButton, Input, Modal } from '../../atoms';
import { CurrencySelect } from '../../atoms/CurrencySelect';
import { ModalParagraph } from '../../atoms/ModalParagraph';
import { ModalSectionHeader } from '../../atoms/ModalSection';
import { useWalletCreation } from '../../hooks/useWalletCreation';
import type { SubTheme } from '../../utils';
import { getTermAndConditionsSentence } from '../../utils/legal';
import { WalletImportModal } from '../WalletImportModal';
import { WalletInformationalModal } from '../WalletInformationalModal';

export interface WalletCreationModalOwnProps {
    theme?: SubTheme;
    isFirstCreation?: boolean;
    onWalletCreate?: (data: { isFirstCreation?: boolean }) => void;
}

type Props = ModalOwnProps & WalletCreationModalOwnProps;

export const WalletCreationModal = ({ theme, isFirstCreation, onWalletCreate, ...modalProps }: Props) => {
    const [walletInfoModal, setWalletInfoModal] = useModalState();
    const [walletImportModal, setWalletImportModal] = useModalState();

    const [walletSettings] = useUserWalletSettings();

    const onSetupFinish = () => {
        onWalletCreate?.({ isFirstCreation });
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
        confirmedPassphrase,
        handleConfirmedPassphraseChange,
        error,
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
                className={theme}
                hasClose={!isFirstCreation}
                {...modalProps}
            >
                {isFirstCreation ? (
                    <ModalParagraph>
                        <p>{c('Wallet setup')
                            .t`Pick a default currency so we can display the value of your Bitcoin transactions using the latest market data at transaction time.`}</p>
                    </ModalParagraph>
                ) : (
                    <ModalParagraph>
                        <p className="m-auto">{c('Wallet setup').t`Choose a name and default currency.`}</p>
                    </ModalParagraph>
                )}
                <div className="flex flex-column gap-1">
                    {!isFirstCreation && (
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
                    )}

                    <div className="mb-4">
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
                </div>

                {!isFirstCreation && (
                    <Collapsible className="mb-4">
                        <CollapsibleHeader
                            className="mb-4 color-weak"
                            suffix={
                                <CollapsibleHeaderIconButton className="color-weak">
                                    <Icon name="chevron-down" />
                                </CollapsibleHeaderIconButton>
                            }
                        >{c('Wallet setup').t`Add a passphrase (optional)`}</CollapsibleHeader>
                        <CollapsibleContent>
                            <ModalSectionHeader header={c('Wallet setup').t`Add a passphrase`}>
                                {c('Wallet setup')
                                    .t`A passphrase acts as a second password. It cannot be changed or added later. Back it up safely to unlock your wallet each time you log in.`}
                            </ModalSectionHeader>
                            <div className="mt-2 flex flex-column gap-1">
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
                                <Input
                                    autoFocus
                                    id="confirmedPassphrase"
                                    as={PasswordInputTwo}
                                    value={confirmedPassphrase}
                                    disabled={loadingWalletSubmit}
                                    onValue={handleConfirmedPassphraseChange}
                                    label={c('Wallet setup').t`Confirm Passphrase`}
                                    placeholder={c('Placeholder').t`Confirm passphrase or leave empty`}
                                    error={error}
                                />
                            </div>

                            <CoreButton
                                className="my-3"
                                shape="underline"
                                color="norm"
                                onClick={() => {
                                    setWalletInfoModal(true);
                                }}
                            >{c('Wallet setup').t`What’s a wallet passphrase?`}</CoreButton>
                        </CollapsibleContent>
                    </Collapsible>
                )}

                <div className="w-full flex flex-row gap-2">
                    <Button
                        fullWidth
                        size="large"
                        shape="solid"
                        color="norm"
                        disabled={loadingWalletSubmit}
                        onClick={() => {
                            void onWalletSubmit({ isFirstCreation });
                        }}
                    >{c('Wallet setup').t`Create new wallet`}</Button>
                    <Button
                        fullWidth
                        className="text-semibold"
                        size="large"
                        shape="ghost"
                        color="norm"
                        disabled={loadingWalletSubmit}
                        onClick={() => {
                            setWalletImportModal(true);
                        }}
                    >{c('Wallet setup').t`Import wallet`}</Button>
                </div>
                <ModalTwoFooter className="prompt-footer">
                    {walletSettings.AcceptTermsAndConditions ? undefined : (
                        <p className="color-weak text-break text-center text-sm">{getTermAndConditionsSentence()}</p>
                    )}
                </ModalTwoFooter>
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
