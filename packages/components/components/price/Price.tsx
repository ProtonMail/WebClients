import humanPrice from '@proton/shared/lib/helpers/humanPrice';
import { Currency } from '@proton/shared/lib/interfaces';

import { classnames } from '../../helpers';

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
}

const Price = ({
    children: amount = 0,
    currency = '',
    className = '',
    divisor = 100,
    suffix = '',
    prefix = '',
    isDisplayedInSentence = false,
}: Props) => {
    const value = humanPrice(amount, divisor);
    const [integer, decimal] = `${value}`.split('.');
    const p = amount < 0 ? <span className="prefix">-</span> : null;
    const v = (
        <span className="amount">
            <span className="integer">{integer}</span>
            {decimal ? <span className="decimal">.{decimal}</span> : null}
        </span>
    );
    const s = suffix ? (
        <span className={classnames(['suffix', !isDisplayedInSentence && 'ml0-25'])}>{suffix}</span>
    ) : null;
    const pr = prefix ? (
        <span className={classnames(['prefix', isDisplayedInSentence && 'mr0-25'])}>{prefix}</span>
    ) : null;

    if (currency === 'CHF') {
        return (
            <span className={classnames(['price flex-item-noshrink inline-flex', className])} data-currency={currency}>
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
            <span className={classnames(['price flex-item-noshrink inline-flex', className])} data-currency={currency}>
                {pr}
                {p}
                {v}
                <span className="currency">&nbsp;€</span>
                {s}
            </span>
        ); // -2 €/month
    }
    return (
        <span className={classnames(['price flex-item-noshrink inline-flex', className])} data-currency={currency}>
            {pr}
            {p}
            {!!currency && <span className="currency">{CURRENCIES[currency as Currency] || currency}</span>}
            {v}
            {s}
        </span>
    ); // -$2/month
};

export default Price;
