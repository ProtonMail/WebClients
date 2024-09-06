import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { Props as SelectProps } from '@proton/components/components/selectTwo/SelectTwo';
import { mainCurrencies } from '@proton/components/payments/core/helpers';
import { DEFAULT_CURRENCY } from '@proton/shared/lib/constants';
import type { Currency } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { ButtonGroup, Option, SelectTwo } from '../../components';

interface SharedProps {
    onSelect: (newCurrency: Currency) => void;
    currency?: Currency;
    currencies: readonly Currency[];
}

type SelectTwoProps = Omit<SelectProps<Currency>, 'onSelect' | 'children'> &
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

type Props = ButtonGroupProps | SelectTwoProps;

const CurrencySelector = (props: Props) => {
    const options = (props.currencies ?? mainCurrencies).map((c) => ({ text: c, value: c }));

    if (props.mode === 'buttons') {
        const { currency = DEFAULT_CURRENCY, onSelect, loading, ...rest } = props;
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
        const { currency = DEFAULT_CURRENCY, onSelect, loading, ...rest } = props;
        const handleChange = ({ value }: { value: Currency }) => onSelect(value);
        return (
            <SelectTwo
                value={currency}
                onChange={handleChange}
                loading={loading}
                aria-describedby={c('Title').t`Currency`}
                {...rest}
            >
                {options.map(({ text, value }) => {
                    return (
                        <Option value={value} title={text} key={value}>
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
