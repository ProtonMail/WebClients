import type { ReactNode } from 'react';

import { type Currency, CurrencySymbols } from '@proton/payments';
import { getCurrencyFormattingConfig } from '@proton/payments/core/currencies';
import clsx from '@proton/utils/clsx';

import { formatPriceWithoutCurrency } from './helper';

import './Price.scss';

export type StyleProps = {
    className?: string;
    suffix?: ReactNode;
    prefix?: string;
    isDisplayedInSentence?: boolean;
    large?: boolean;
    suffixClassName?: string;
    currencyClassName?: string;
    amountClassName?: string;
    wrapperClassName?: string;
    suffixNextLine?: boolean;
};

export type Props = {
    children: number | string; // amount in base units (cents for USD/CHF/EUR)
    currency: Currency;
    'data-testid'?: string;
} & StyleProps;

const Price = ({
    children: amount = 0,
    currency,
    className = '',
    suffix = '',
    prefix = '',
    isDisplayedInSentence = false,
    large,
    'data-testid': dataTestId,
    wrapperClassName = 'shrink-0 inline-flex items-baseline',
    suffixClassName,
    currencyClassName,
    amountClassName,
    suffixNextLine = false,
}: Props) => {
    const { symbolPosition } = getCurrencyFormattingConfig(currency);

    const value = typeof amount === 'string' ? amount : formatPriceWithoutCurrency(amount, currency);
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

        const currencySymbol = CurrencySymbols[currency as Currency] || currency;

        if (symbolPosition === 'suffix-space') {
            return (
                <>
                    {valueElement}
                    <span className={clsx(['currency', currencyClassName])}>&nbsp;{currencySymbol}</span>
                </>
            );
        }

        const hasSpace = symbolPosition === 'prefix-space';

        return (
            <>
                <span className={clsx(['currency', currencyClassName])}>
                    {currencySymbol}
                    {hasSpace && <>&nbsp;</>}
                </span>
                {valueElement}
            </>
        );
    })();

    // -$2/month, -CHF 2/month, -BRL 2/month, -2 €/month
    if (!suffixNextLine) {
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
        );
    }

    return (
        <div className="flex flex-column">
            <span
                className={clsx(['price', wrapperClassName, large && 'price--large', className])}
                data-currency={currency}
            >
                {prefixElement}
                {signElement}
                {currencyAndValueElement}
            </span>
            {suffixElement}
        </div>
    );
};

export default Price;
