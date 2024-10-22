import { c } from 'ttag';

import { Button } from '@proton/atoms';
import ButtonGroup from '@proton/components/components/button/ButtonGroup';
import Option from '@proton/components/components/option/Option';
import type { SelectTwoProps } from '@proton/components/components/selectTwo/SelectTwo';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { mainCurrencies } from '@proton/payments';
import { DEFAULT_CURRENCY } from '@proton/shared/lib/constants';
import type { Currency } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

interface SharedProps {
    onSelect: (newCurrency: Currency) => void;
    currency?: Currency;
    currencies: readonly Currency[];
}

type InternalSelectProps = Omit<SelectTwoProps<Currency>, 'onSelect' | 'children'> &
    SharedProps & {
        mode: 'select-two';
    };

type ButtonGroupProps = {
    mode: 'buttons';
    loading?: boolean;
    className?: string;
    id?: string;
    disabled?: boolean;
} & SharedProps;

type Props = ButtonGroupProps | InternalSelectProps;

const CurrencySelector = (props: Props) => {
    const options = (props.currencies ?? mainCurrencies).map((c) => ({ text: c, value: c }));

    if (props.mode === 'buttons') {
        // extracting `mode` and `currencies` in order to remove them from ...rest
        const { currency = DEFAULT_CURRENCY, onSelect, loading, mode, currencies, ...rest } = props;
        return (
            <ButtonGroup {...rest}>
                {options.map(({ text, value }) => {
                    return (
                        <Button
                            className={clsx([currency === value && 'is-selected'])}
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

    if (props.mode === 'select-two') {
        // extracting `mode` and `currencies` in order to remove them from ...rest
        const { currency = DEFAULT_CURRENCY, onSelect, loading, mode, currencies, ...rest } = props;
        const handleChange = ({ value }: { value: Currency }) => onSelect(value);
        return (
            <SelectTwo
                value={currency}
                onChange={handleChange}
                loading={loading}
                aria-describedby={c('Title').t`Currency`}
                data-testid="currency-selector"
                {...rest}
            >
                {options.map(({ text, value }) => {
                    return (
                        <Option value={value} title={text} key={value} data-testid={`currency-option-${value}`}>
                            {text}
                        </Option>
                    );
                })}
            </SelectTwo>
        );
    }

    return null;
};

export default CurrencySelector;
