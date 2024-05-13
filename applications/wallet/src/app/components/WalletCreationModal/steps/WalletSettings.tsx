import { ChangeEvent, useState } from 'react';

import { c } from 'ttag';

import { WasmFiatCurrencySymbol } from '@proton/andromeda';
import useLoading from '@proton/hooks/useLoading';

import { Button, Input, Select } from '../../../atoms';
import { useFiatCurrencies } from '../../../store/hooks';

const DEFAULT_CURRENCY: WasmFiatCurrencySymbol = 'USD';
const MIN_WALLET_NAME_LENGTH = 3;

interface Props {
    onContinue: (name: string, fiatCurrency: string) => Promise<void>;
}

export const WalletSettings = ({ onContinue }: Props) => {
    const [loading, withLoading] = useLoading();

    const [name, setName] = useState<string>('');

    const [currencies, loadingFiatCurrencies] = useFiatCurrencies();
    const [selectedCurrency, setSelectedCurrency] = useState<WasmFiatCurrencySymbol>(DEFAULT_CURRENCY);

    return (
        <div className="flex flex-column">
            <div className="mb-4">
                <Input
                    label={c('Wallet setup').t`Wallet name`}
                    id="wallet-name-input"
                    placeholder={c('Wallet setup').t`My favorite wallet`}
                    value={name}
                    disabled={loading}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        setName(event.target.value);
                    }}
                />
            </div>

            <div className="mb-4">
                <Select
                    disabled={loadingFiatCurrencies}
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

            <Button
                pill
                disabled={name.length <= MIN_WALLET_NAME_LENGTH || loading}
                className="block w-4/5 mx-auto mt-4 mb-2"
                shape="solid"
                color="norm"
                onClick={() => withLoading(name ? onContinue(name, selectedCurrency) : Promise.resolve())}
            >
                {c('Wallet setup').t`Continue`}
            </Button>
        </div>
    );
};
