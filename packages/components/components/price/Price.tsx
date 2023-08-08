import { ReactNode } from 'react';

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
    children: number | string;
    currency?: Currency | string;
    className?: string;
    divisor?: number;
    suffix?: ReactNode;
    prefix?: string;
    isDisplayedInSentence?: boolean;
    large?: boolean;
    'data-testid'?: string;
    suffixClassName?: string;
    currencyClassName?: string;
    amountClassName?: string;
    wrapperClassName?: string;
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
    wrapperClassName = 'flex-item-noshrink inline-flex flex-align-items-baseline',
    suffixClassName,
    currencyClassName,
    amountClassName,
}: Props) => {
    const value = typeof amount === 'string' ? amount : humanPrice(amount, divisor);
    const [integer, decimal] = `${value}`.split('.');
    const p = typeof amount === 'number' && amount < 0 ? <span className="prefix">-</span> : null;
    const v = (
        <span className={clsx(['amount', 'amount--large', amountClassName])} data-testid={dataTestId}>
            <span className="integer">{integer}</span>
            {decimal ? <span className="decimal">.{decimal}</span> : null}
        </span>
    );
    const s = suffix ? (
        <span className={clsx(['suffix', suffixClassName, !isDisplayedInSentence && 'ml-1'])}>{suffix}</span>
    ) : null;
    const pr = prefix ? <span className={clsx(['prefix', isDisplayedInSentence && 'mr-1'])}>{prefix}</span> : null;

    if (currency === 'CHF') {
        return (
            <span
                className={clsx(['price', wrapperClassName, large && 'price--large', className])}
                data-currency={currency}
            >
                {pr}
                {p}
                <span className={clsx(['currency', currencyClassName])}>CHF&nbsp;</span>
                {v}
                {s}
            </span>
        ); // -CHF 2/month
    }

    if (currency === 'EUR') {
        return (
            <span
                className={clsx(['price', wrapperClassName, large && 'price--large', className])}
                data-currency={currency}
            >
                {pr}
                {p}
                {v}
                <span className={clsx(['currency', currencyClassName])}>&nbsp;€</span>
                {s}
            </span>
        ); // -2 €/month
    }
    return (
        <span
            className={clsx(['price', wrapperClassName, large && 'price--large', className])}
            data-currency={currency}
        >
            {pr}
            {p}
            {!!currency && (
                <span className={clsx(['currency', currencyClassName])}>
                    {CURRENCIES[currency as Currency] || currency}
                </span>
            )}
            {v}
            {s}
        </span>
    ); // -$2/month
};

export default Price;
