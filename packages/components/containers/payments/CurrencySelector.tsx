import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Props as SelectProps } from '@proton/components/components/selectTwo/SelectTwo';
import { CURRENCIES, DEFAULT_CURRENCY } from '@proton/shared/lib/constants';
import { Currency } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { ButtonGroup, Option, SelectTwo } from '../../components';

interface SelectTwoProps extends Omit<SelectProps<Currency>, 'onSelect' | 'children'> {
    mode: 'select-two';
    currency?: Currency;
    onSelect: (newCurrency: Currency) => void;
}

interface ButtonGroupProps {
    mode: 'buttons';
    onSelect: (newCurrency: Currency) => void;
    currency?: Currency;
    loading?: boolean;
    className?: string;
    id?: string;
    disabled?: boolean;
}

type Props = ButtonGroupProps | SelectTwoProps;

const CurrencySelector = (props: Props) => {
    const options = CURRENCIES.map((c) => ({ text: c, value: c }));

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
                // eslint-disable-next-line jsx-a11y/aria-props
                aria-description={c('Title').t`Currency`}
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
