import { c } from 'ttag';

import { WasmApiWalletAccount } from '@proton/andromeda';
import {
    Dropdown,
    DropdownButton,
    DropdownMenu,
    DropdownMenuButton,
    Icon,
    ModalOwnProps,
    usePopperAnchor,
} from '@proton/components/components';
import { IWasmApiWalletData } from '@proton/wallet';

import { Input } from '../../atoms';
import { CurrencySelect } from '../../atoms/CurrencySelect';
import { EmailIntegrationInput } from '../EmailIntegrationInput';
import { useAccountPreferences } from './useAccountPreferences';

interface Props extends ModalOwnProps {
    wallet: IWasmApiWalletData;
    walletAccount: WasmApiWalletAccount;
    otherWallets: IWasmApiWalletData[];
}

export const AccountPreferences = ({ wallet, walletAccount, otherWallets }: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const {
        label,
        isLoadingLabelUpdate,
        onChangeLabel,
        updateWalletAccountLabel,

        deleteWalletAccount,

        currencies,
        loadingCurrencies,

        isLoadingFiatCurrencyUpdate,
        onChangeFiatCurrency,

        addressesWithAvailability,
        isLoadingEmailUpdate,
        onAddEmailAddresses,
        onRemoveEmailAddress,
    } = useAccountPreferences(wallet, walletAccount, otherWallets);

    return (
        <>
            <div className="flex flex-column my-4 bg-weak rounded-xl">
                <Input
                    label={c('Wallet preference').t`Account label`}
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
                                className="rounded-full"
                                size="small"
                                disabled={isLoadingLabelUpdate}
                            >
                                <Icon size={3} name="three-dots-vertical" alt={c('Action').t`More options`} />
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
                <hr className="my-0" />
                <CurrencySelect
                    disabled={loadingCurrencies || isLoadingFiatCurrencyUpdate}
                    label={c('Wallet preferences').t`Local currency`}
                    placeholder={c('Wallet preferences').t`Select your currency`}
                    value={walletAccount.FiatCurrency}
                    onSelect={(value) => {
                        void onChangeFiatCurrency(value.Symbol);
                    }}
                    options={currencies ?? []}
                />
                <hr className="my-0" />
                <EmailIntegrationInput
                    value={walletAccount.Addresses}
                    options={addressesWithAvailability}
                    loading={isLoadingEmailUpdate}
                    onAddAddresses={(addresses) => {
                        void onAddEmailAddresses(addresses);
                    }}
                    onRemoveAddress={(address) => {
                        void onRemoveEmailAddress(address);
                    }}
                />
            </div>
        </>
    );
};
