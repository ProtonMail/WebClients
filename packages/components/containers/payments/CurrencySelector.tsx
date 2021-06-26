import React from 'react';
import { CURRENCIES, DEFAULT_CURRENCY } from '@proton/shared/lib/constants';
import { c } from 'ttag';
import { Currency } from '@proton/shared/lib/interfaces';

import { Select, ButtonGroup, Button } from '../../components';
import { classnames } from '../../helpers';

const addSymbol = (currency: Currency) => {
    if (currency === 'EUR') {
        return `€ ${currency}`;
    }

    if (currency === 'USD') {
        return `$ ${currency}`;
    }

    return currency;
};

interface Props {
    mode?: 'select' | 'buttons';
    currency?: Currency;
    onSelect: (newCurrency: Currency) => void;
    loading?: boolean;
    className?: string;
    id?: string;
    disabled?: boolean;
}

const CurrencySelector = ({ currency = DEFAULT_CURRENCY, onSelect, mode = 'select', loading, ...rest }: Props) => {
    const options = CURRENCIES.map((c) => ({ text: c, value: c }));

    if (mode === 'buttons') {
        return (
            <ButtonGroup {...rest}>
                {options.map(({ text, value }) => {
                    return (
                        <Button
                            className={classnames([currency === value && 'is-selected'])}
                            key={value}
                            onClick={() => onSelect(value as Currency)}
                            disabled={loading}
                        >
                            {text}
                        </Button>
                    );
                })}
            </ButtonGroup>
        );
    }

    if (mode === 'select') {
        return (
            <Select
                title={c('Title').t`Currency`}
                value={currency}
                options={options.map((option) => ({ ...option, text: addSymbol(option.text as Currency) }))}
                onChange={({ target }) => onSelect(target.value as Currency)}
                loading={loading}
                {...rest}
            />
        );
    }

    return null;
};

export default CurrencySelector;
