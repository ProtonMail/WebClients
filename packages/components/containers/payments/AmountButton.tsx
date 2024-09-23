import type { ButtonProps } from '@proton/atoms';
import { Button } from '@proton/atoms';
import Price from '@proton/components/components/price/Price';
import type { Currency } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

interface Props extends Omit<ButtonProps, 'onSelect' | 'onClick'> {
    value?: number;
    amount?: number;
    currency?: Currency;
    onSelect: (value: number) => void;
}

const AmountButton = ({ value = 0, amount = 0, currency, onSelect, className = '', ...rest }: Props) => {
    return (
        <Button
            aria-pressed={value === amount}
            className={clsx(['field', className, value === amount && 'is-active'])}
            onClick={() => onSelect(value)}
            {...rest}
        >
            <Price currency={currency}>{value}</Price>
        </Button>
    );
};

export default AmountButton;
