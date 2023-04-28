import humanPrice from '@proton/shared/lib/helpers/humanPrice';
import { Currency } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import './Price.scss';

const CURRENCIES = {
    USD: '$',
    EUR: '€',
    CHF: 'CHF',
};

export interface Props {
    children: number;
    currency?: Currency | string;
    className?: string;
    divisor?: number;
    suffix?: string;
    prefix?: string;
    isDisplayedInSentence?: boolean;
    large?: boolean;
    'data-testid'?: string;
}

const Price = ({
    children: amount = 0,
    currency = '',
    className = '',
    divisor = 100,
    suffix = '',
    prefix = '',
    isDisplayedInSentence = false,
    large,
    'data-testid': dataTestId,
}: Props) => {
    const value = humanPrice(amount, divisor);
    const [integer, decimal] = `${value}`.split('.');
    const p = amount < 0 ? <span className="prefix">-</span> : null;
    const v = (
        <span className={clsx(['amount', 'amount--large'])} data-testid={dataTestId}>
            <span className="integer">{integer}</span>
            {decimal ? <span className="decimal">.{decimal}</span> : null}
        </span>
    );
    const s = suffix ? <span className={clsx(['suffix', !isDisplayedInSentence && 'ml-1'])}>{suffix}</span> : null;
    const pr = prefix ? <span className={clsx(['prefix', isDisplayedInSentence && 'mr-1'])}>{prefix}</span> : null;

    if (currency === 'CHF') {
        return (
            <span
                className={clsx([
                    'price flex-item-noshrink inline-flex flex-align-items-baseline',
                    large && 'price--large',
                    className,
                ])}
                data-currency={currency}
            >
                {pr}
                {p}
                <span className="currency">CHF&nbsp;</span>
                {v}
                {s}
            </span>
        ); // -CHF 2/month
    }

    if (currency === 'EUR') {
        return (
            <span
                className={clsx([
                    'price flex-item-noshrink inline-flex flex-align-items-baseline',
                    large && 'price--large',
                    className,
                ])}
                data-currency={currency}
            >
                {pr}
                {p}
                {v}
                <span className="currency">&nbsp;€</span>
                {s}
            </span>
        ); // -2 €/month
    }
    return (
        <span
            className={clsx([
                'price flex-item-noshrink inline-flex flex-align-items-baseline',
                large && 'price--large',
                className,
            ])}
            data-currency={currency}
        >
            {pr}
            {p}
            {!!currency && <span className="currency">{CURRENCIES[currency as Currency] || currency}</span>}
            {v}
            {s}
        </span>
    ); // -$2/month
};

export default Price;
