import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { mainCurrencies } from '@proton/payments/core/currencies';
import type { Currency } from '@proton/payments/core/interface';
import clsx from '@proton/utils/clsx';

import ButtonGroup from '../../components/button/ButtonGroup';
import Option from '../../components/option/Option';
import type { SelectTwoProps } from '../../components/selectTwo/SelectTwo';
import SelectTwo from '../../components/selectTwo/SelectTwo';

interface SharedProps {
    onSelect: (newCurrency: Currency) => void;
    currency: Currency;
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
        const { currency, onSelect, loading, mode, currencies, ...rest } = props;
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
        const { currency, onSelect, loading, mode, currencies, ...rest } = props;
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
