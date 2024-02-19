import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Input } from '@proton/atoms/Input';
import { Option, SelectTwo } from '@proton/components/components';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';

interface Props {
    onContinue: (name: string, fiatCurrency: string) => void;
}

export const WalletNameAndFiatInput = ({ onContinue }: Props) => {
    const [name, setName] = useState<string>();
    const [fiatCurrency, setFiatCurrency] = useState<string>('USD');

    return (
        <ModalContent className="p-0 m-0">
            <div className="p-6 flex flex-column">
                <span className="block h4 text-bold mx-auto">{c('Wallet setup').t`Name your new wallet`}</span>

                <div className="flex flex-row mt-6">
                    <label className="w-1/4 mr-2 text-semibold block mt-2" htmlFor="wallet-name-input">
                        <span>{c('Wallet setup').t`Name`}</span>
                    </label>

                    <div className="w-2/4">
                        <Input
                            id="wallet-name-input"
                            placeholder={c('Wallet setup').t`Wallet name`}
                            value={name}
                            onChange={(event) => {
                                setName(event.target.value);
                            }}
                        />
                    </div>
                </div>

                <div className="flex flex-row mt-2">
                    <label
                        className="w-1/4 mr-2 text-semibold block mt-2"
                        id="label-fiat-currency"
                        htmlFor="fiat-currency-selector"
                    >
                        <span className="mr-2">{c('Wallet setup').t`Currency`}</span>
                    </label>

                    <div className="w-2/4">
                        <SelectTwo
                            id="fiat-currency-selector"
                            aria-describedby="label-fiat-currency"
                            value={fiatCurrency}
                            onChange={(event) => {
                                setFiatCurrency(event.value);
                            }}
                        >
                            {['USD', 'EUR', 'CHF'].map((currency) => {
                                return <Option title={currency} value={currency} key={currency} />;
                            })}
                        </SelectTwo>
                    </div>
                </div>

                <Button
                    color="norm"
                    disabled={!name}
                    onClick={() => {
                        if (name) {
                            onContinue(name, fiatCurrency);
                        }
                    }}
                    className="mt-10"
                >{c('Wallet setup').t`Continue`}</Button>
            </div>
        </ModalContent>
    );
};
