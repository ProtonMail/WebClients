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
