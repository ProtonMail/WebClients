import { useState } from 'react';

import { c } from 'ttag';

import { WasmFiatCurrencySymbol } from '@proton/andromeda';
import useLoading from '@proton/hooks/useLoading';

import { Button, Modal, Select } from '../../atoms';
import { useWalletSetup } from '../../hooks/useWalletSetup';
import { WalletSetupScheme } from '../../hooks/useWalletSetup/type';
import { useFiatCurrencies } from '../../store/hooks';

const DEFAULT_CURRENCY: WasmFiatCurrencySymbol = 'USD';

interface Props {
    open: boolean;
    /**
     * If wallet has already been created on Mail, we only display the modal to change currency settings, no wallet to create
     */
    dryRun?: boolean;
}

export const WalletAutoCreationNoticeModal = ({ open, dryRun }: Props) => {
    const [loadingWalletCreation, withLoading] = useLoading();
    const [currencies, loading] = useFiatCurrencies();
    const [selectedCurrency, setSelectedCurrency] = useState<WasmFiatCurrencySymbol>(DEFAULT_CURRENCY);

    // no need to call onClose, modal will get closed once wallet creation is dispatched in store
    const { onWalletSubmit } = useWalletSetup({
        schemeAndData: { scheme: WalletSetupScheme.WalletAutocreationFinalize },
        onSetupFinish: () => {},
    });

    const handleSaveAndView = async () => {
        if (dryRun) {
            // TODO: here we only need to set fiat currency on autocreated wallet/wallet accounts
        } else {
            await onWalletSubmit(c('Wallet setup').t`My first wallet`, 'USD');
        }
    };

    return (
        <Modal
            open={open}
            title={c('Wallet autocreation').t`Almost done`}
            subline={c('Wallet autocreation')
                .t`We have already created a wallet for you, you only have to review the settings below.`}
        >
            <div>
                <Select
                    disabled={loading}
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

            <div className="flex flex-column items-center my-6 w-full">
                <Button
                    disabled={loadingWalletCreation}
                    pill
                    fullWidth
                    shape="solid"
                    color="norm"
                    onClick={() => {
                        void withLoading(handleSaveAndView);
                    }}
                >{c('Wallet autocreation').t`Save and view my wallet`}</Button>
                <Button
                    disabled={loadingWalletCreation}
                    className="mt-2 color-weak"
                    shape="ghost"
                    color="weak"
                    style={{ background: 'transparent' }}
                >{c('Wallet autocreation').t`Import wallet`}</Button>
            </div>
        </Modal>
    );
};
