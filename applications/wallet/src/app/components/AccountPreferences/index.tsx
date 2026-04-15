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
import InputFieldStackedGroup from '@proton/components/components/inputFieldStacked/InputFieldStackedGroup';
import { IcKey } from '@proton/icons/icons/IcKey';
import { IcPassTrash } from '@proton/icons/icons/IcPassTrash';
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical';
import type { IWasmApiWalletData } from '@proton/wallet/types';

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

        getConvertedXpub,
        getDescriptor,

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
    const [descriptor, setDescriptor] = useState<string | undefined>(undefined);

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
                            <IcThreeDotsVertical size={4} className="color-weak" alt={c('Action').t`More options`} />
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
                                        setXpub(await getConvertedXpub());
                                        setDescriptor(await getDescriptor());
                                        setExtendedPublicKeyModalState(true);
                                    }}
                                >
                                    {c('Wallet preference').t`Show public key (XPUB)`}
                                    <div className="flex ml-2">
                                        <IcKey />
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
                                        <IcPassTrash />
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

            {renderExtendedPublicKeyModalState && xpub && descriptor && (
                <ExtendedPublicKeyModal
                    accountLabel={walletAccount.Label}
                    xpub={xpub}
                    descriptor={descriptor}
                    index={index}
                    {...extendedPublicKeyModalState}
                />
            )}
        </InputFieldStackedGroup>
    );
};
