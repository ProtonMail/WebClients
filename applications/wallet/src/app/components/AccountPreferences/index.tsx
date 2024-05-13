import { c } from 'ttag';

import { WasmApiWalletAccount } from '@proton/andromeda';
import { Icon, ModalOwnProps } from '@proton/components/components';
import { IWasmApiWalletData } from '@proton/wallet';

import { CoreButton, Input, Select } from '../../atoms';
import { EmailIntegrationInput } from '../EmailIntegrationInput';
import { useAccountPreferences } from './useAccountPreferences';

interface Props extends ModalOwnProps {
    wallet: IWasmApiWalletData;
    walletAccount: WasmApiWalletAccount;
    otherWallets: IWasmApiWalletData[];
}

export const AccountPreferences = ({ wallet, walletAccount, otherWallets }: Props) => {
    const {
        label,
        isLoadingLabelUpdate,
        onChangeLabel,
        updateWalletAccountLabel,

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
                    suffix={
                        <CoreButton icon size="small">
                            <Icon
                                name="arrow-down-line"
                                onClick={() => {
                                    updateWalletAccountLabel();
                                }}
                            />
                        </CoreButton>
                    }
                />
                <hr className="my-0" />
                <Select
                    disabled={loadingCurrencies || isLoadingFiatCurrencyUpdate}
                    name="currency"
                    label={c('Wallet preferences').t`Local currency`}
                    placeholder="USD"
                    value={walletAccount.FiatCurrency}
                    onValue={(value) => {
                        void onChangeFiatCurrency(value);
                    }}
                    options={currencies?.map((c) => ({ label: c.Name, value: c.Symbol, id: c.ID })) ?? []}
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
