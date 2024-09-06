import type { ReactNode } from 'react';

import { CurrencySymbols } from '@proton/shared/lib/constants';
import type { Currency } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { humanPrice } from './helper';

import './Price.scss';

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
    wrapperClassName = 'shrink-0 inline-flex items-baseline',
    suffixClassName,
    currencyClassName,
    amountClassName,
}: Props) => {
    const value = typeof amount === 'string' ? amount : humanPrice(amount, divisor);
    const [integer, decimal] = `${value}`.split('.');

    const signElement = typeof amount === 'number' && amount < 0 ? <span className="prefix">-</span> : null;
    const valueElement = (
        <span className={clsx(['amount', 'amount--large', amountClassName])} data-testid={dataTestId}>
            <span className="integer">{integer}</span>
            {decimal ? <span className="decimal">.{decimal}</span> : null}
        </span>
    );
    const suffixElement = suffix ? (
        <span className={clsx(['suffix', suffixClassName, !isDisplayedInSentence && 'ml-1'])}>{suffix}</span>
    ) : null;
    const prefixElement = prefix ? (
        <span className={clsx(['prefix', isDisplayedInSentence && 'mr-1'])}>{prefix}</span>
    ) : null;

    const currencyAndValueElement = (() => {
        if (!currency) {
            return valueElement;
        }

        if (currency === 'EUR') {
            return (
                <>
                    {valueElement}
                    <span className={clsx(['currency', currencyClassName])}>&nbsp;€</span>
                </>
            );
        }

        const hasSpace = currency !== 'USD';
        return (
            <>
                <span className={clsx(['currency', currencyClassName])}>
                    {CurrencySymbols[currency as Currency] || currency}
                    {hasSpace && <>&nbsp;</>}
                </span>
                {valueElement}
            </>
        );
    })();

    return (
        <span
            className={clsx(['price', wrapperClassName, large && 'price--large', className])}
            data-currency={currency}
        >
            {prefixElement}
            {signElement}
            {currencyAndValueElement}
            {suffixElement}
        </span>
    ); // -$2/month, -CHF 2/month, -BRL 2/month, -2 €/month
};

export default Price;
