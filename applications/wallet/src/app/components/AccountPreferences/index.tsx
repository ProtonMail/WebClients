import { useState } from 'react';

import { c } from 'ttag';

import type { WasmApiWalletAccount } from '@proton/andromeda';
import {
    Dropdown,
    DropdownButton,
    DropdownMenu,
    DropdownMenuButton,
    DropdownSizeUnit,
    useModalState,
    usePopperAnchor,
} from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';
import InputFieldStackedGroup from '@proton/components/components/inputFieldStacked/InputFieldStackedGroup';
import type { IWasmApiWalletData } from '@proton/wallet';

import { Input } from '../../atoms';
import { CurrencySelect } from '../../atoms/CurrencySelect';
import { ExtendedPublicKeyModal } from '../ExtendedPublicKeyModal';
import { EmailIntegrationInput } from './EmailIntegrationInput';
import { useAccountPreferences } from './useAccountPreferences';

import './AccountPreferences.scss';

interface Props {
    wallet: IWasmApiWalletData;
    walletAccount: WasmApiWalletAccount;
    otherWallets: IWasmApiWalletData[];
    shouldShowBvEWarning: boolean;
    index: number;
}

export const AccountPreferences = ({ wallet, walletAccount, otherWallets, shouldShowBvEWarning, index }: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const {
        label,
        isLoadingLabelUpdate,
        onChangeLabel,
        updateWalletAccountLabel,

        getXpub,

        deleteWalletAccount,

        currencies,
        loadingCurrencies,

        isLoadingFiatCurrencyUpdate,
        onChangeFiatCurrency,

        addressesWithAvailability,
        isLoadingEmailUpdate,

        onAddEmailAddress,
        onRemoveEmailAddress,
        onReplaceEmailAddress,
    } = useAccountPreferences(wallet, walletAccount, otherWallets);

    const [extendedPublicKeyModalState, setExtendedPublicKeyModalState, renderExtendedPublicKeyModalState] =
        useModalState();
    const [xpub, setXpub] = useState<string | undefined>(undefined);

    return (
        <InputFieldStackedGroup>
            <Input
                isGroupElement
                label={c('Wallet preference').t`Account name`}
                placeholder={c('Wallet preference').t`My super account`}
                value={label}
                onChange={onChangeLabel}
                disabled={isLoadingLabelUpdate}
                onBlur={() => {
                    if (label) {
                        updateWalletAccountLabel();
                    }
                }}
                suffix={
                    <>
                        <DropdownButton
                            ref={anchorRef}
                            isOpen={isOpen}
                            onClick={toggle}
                            icon
                            className="rounded-full p-3 border-none"
                            size="small"
                            disabled={isLoadingLabelUpdate}
                        >
                            <Icon
                                size={4}
                                name="three-dots-vertical"
                                className="color-weak"
                                alt={c('Action').t`More options`}
                            />
                        </DropdownButton>
                        <Dropdown
                            isOpen={isOpen}
                            anchorRef={anchorRef}
                            onClose={close}
                            originalPlacement="bottom-start"
                            className="bg-weak"
                        >
                            <DropdownMenu>
                                <DropdownMenuButton
                                    className="text-left flex flex-row items-center"
                                    disabled={isLoadingLabelUpdate}
                                    onClick={async () => {
                                        setXpub(await getXpub());
                                        setExtendedPublicKeyModalState(true);
                                    }}
                                >
                                    {c('Wallet preference').t`Show public key (XPUB)`}
                                    <div className="flex ml-2">
                                        <Icon name="key" />
                                    </div>
                                </DropdownMenuButton>
                                <DropdownMenuButton
                                    className="text-left flex flex-row items-center"
                                    actionType="delete"
                                    disabled={isLoadingLabelUpdate}
                                    onClick={() => {
                                        deleteWalletAccount();
                                    }}
                                >
                                    {c('Wallet preference').t`Delete account`}
                                    <div className="flex ml-2">
                                        <Icon name="pass-trash" />
                                    </div>
                                </DropdownMenuButton>
                            </DropdownMenu>
                        </Dropdown>
                    </>
                }
            />

            <CurrencySelect
                disabled={loadingCurrencies || isLoadingFiatCurrencyUpdate}
                label={c('Wallet preferences').t`Local currency`}
                placeholder={c('Wallet preferences').t`Select your currency`}
                value={walletAccount.FiatCurrency}
                onSelect={(value) => {
                    void onChangeFiatCurrency(value.Symbol);
                }}
                options={currencies ?? []}
                size={{
                    width: DropdownSizeUnit.Anchor,
                    maxWidth: DropdownSizeUnit.Viewport,
                }}
                isGroupElement
            />

            <EmailIntegrationInput
                wallet={wallet}
                walletAccount={walletAccount}
                options={addressesWithAvailability}
                loading={isLoadingEmailUpdate}
                shouldShowBvEWarning={shouldShowBvEWarning}
                onAddAddress={(address) => {
                    void onAddEmailAddress(address);
                }}
                onRemoveAddress={(address) => {
                    void onRemoveEmailAddress(address);
                }}
                onReplaceAddress={(oldAddress, address) => {
                    void onReplaceEmailAddress(oldAddress, address);
                }}
            />

            {renderExtendedPublicKeyModalState && xpub && (
                <ExtendedPublicKeyModal
                    accountLabel={walletAccount.Label}
                    xpub={xpub}
                    index={index}
                    {...extendedPublicKeyModalState}
                />
            )}
        </InputFieldStackedGroup>
    );
};
