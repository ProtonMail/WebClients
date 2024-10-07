import type { WasmApiExchangeRate, WasmBitcoinUnit, WasmFiatCurrencySymbol } from '@proton/andromeda';
import type { Props as PriceOwnProps } from '@proton/components/components/price/Price';
import CorePrice from '@proton/components/components/price/Price';
import '@proton/components/components/price/Price.scss';
import { dateLocale } from '@proton/shared/lib/i18n';
import clsx from '@proton/utils/clsx';
import { COMPUTE_BITCOIN_UNIT } from '@proton/wallet';

import { MaybeHiddenAmount } from '../../atoms/MaybeHiddenAmount';
import { convertAmount, convertAmountStr, isExchangeRateFromBitcoinUnit } from '../../utils';

type ClassNamesProps = {
    [group in string]?: string;
};

const formatterByCurrency: Map<string, Intl.NumberFormat> = new Map();

interface Props extends Omit<PriceOwnProps, 'children' | 'currency' | 'divisor'> {
    unit: WasmBitcoinUnit | WasmApiExchangeRate;
    /**
     * Amount in sats
     */
    amount: number | string;
    withPositiveSign?: boolean;
    className?: string;
    signClassName?: string;
    amountClassName?: string;
    currencyClassName?: string;
    classNames?: ClassNamesProps;
    preventHideAmount?: boolean;
    'data-testid'?: string;
}

export { CorePrice };

const tryNumberFormat = (currency: string, minimumFractionDigits: number): Intl.NumberFormat => {
    const commonParams = {
        style: 'currency',
        currencyDisplay: 'symbol',
    } as const;

    try {
        return new Intl.NumberFormat(dateLocale.code, {
            signDisplay: 'exceptZero',
            currency: currency,
            minimumFractionDigits: minimumFractionDigits,
            ...commonParams,
        });
    } catch (err) {
        return new Intl.NumberFormat(dateLocale.code, {
            signDisplay: 'exceptZero',
            currency: 'USD',
            minimumFractionDigits: 2,
            ...commonParams,
        });
    }
};

const partsToJsx = ({
    parts,
    amount,
    withPositiveSign,
    signClassName,
    amountClassName,
    currencyClassName,
    classNames,
    time,
    isStringAmount,
    currency,
}: {
    parts: Intl.NumberFormatPart[];
    amount: string | number;
    withPositiveSign: boolean;
    className?: string;
    signClassName?: string;
    amountClassName?: string;
    currencyClassName?: string;
    classNames?: ClassNamesProps;
    time: string;
    isStringAmount: boolean;
    currency: WasmFiatCurrencySymbol;
}) => {
    return parts.map(({ type, value }, index) => {
        const key = `${time}-${value}-${currency}-${type}-${index}`;

        switch (type) {
            case 'currency':
                return (
                    <span key={key} className={clsx(['currency', currencyClassName, classNames?.currency])}>
                        {value}
                    </span>
                );
            case 'plusSign':
                return withPositiveSign ? (
                    <span
                        key={key}
                        className={clsx(['text-pre', signClassName, amountClassName, classNames?.plusSign])}
                    >
                        {value}{' '}
                    </span>
                ) : (
                    <span></span>
                );
            case 'minusSign':
                return (
                    <span
                        key={key}
                        className={clsx(['text-pre', signClassName, amountClassName, classNames?.minusSign])}
                    >
                        {value}{' '}
                    </span>
                );
            case 'integer':
                return (
                    <span key={key} className={clsx(['amount', 'amount--large', amountClassName, classNames?.integer])}>
                        {/* If input amount is a string, we replaced it to format currency but we want to use provided string here  */}
                        {isStringAmount ? amount : value}
                    </span>
                );
            case 'group':
                return (
                    <span key={key} className={clsx([amountClassName, classNames?.group])}>
                        {value}
                    </span>
                );
            case 'decimal':
                return isStringAmount ? null : (
                    <span key={key} className={clsx(['decimal', amountClassName, classNames?.decimal])}>
                        {value}
                    </span>
                );
            case 'fraction':
                return isStringAmount ? null : (
                    <span key={key} className={clsx(['decimal', amountClassName, classNames?.fraction])}>
                        {value}
                    </span>
                );
            case 'literal':
                return (
                    <span key={key} className={clsx(['text-pre', classNames?.literal])}>
                        {value}
                    </span>
                );
            default:
                return value;
        }
    });
};

export const Price = ({
    unit,
    amount: _amount,
    withPositiveSign = false,
    className,
    signClassName,
    amountClassName,
    currencyClassName,
    classNames,
    wrapperClassName = 'shrink-0 inline-flex items-baseline',
    large,
    preventHideAmount,
    ...props
}: Props) => {
    const isStringAmount = typeof _amount === 'string';
    if (typeof unit !== 'object' || isExchangeRateFromBitcoinUnit(unit)) {
        const amount = isStringAmount ? _amount : convertAmountStr(_amount, COMPUTE_BITCOIN_UNIT, unit);
        const currency = typeof unit === 'object' ? unit.FiatCurrency : unit;

        return (
            <span
                className={clsx(['price', wrapperClassName, large && 'price--large', classNames?.price, className])}
                data-currency={currency}
            >
                <MaybeHiddenAmount preventHideAmount={preventHideAmount}>
                    <span
                        key={`${_amount}-${currency}-amount`}
                        className={clsx(['amount', 'amount--large', amountClassName, classNames?.integer])}
                    >
                        {amount}
                    </span>
                </MaybeHiddenAmount>

                <span key={`${_amount}-${currency}-literal`} className={clsx(['text-pre', classNames?.literal])}>
                    {' '}
                </span>

                <span
                    key={`${_amount}-${currency}-currency`}
                    className={clsx(['currency', currencyClassName, classNames?.currency])}
                >
                    {currency}
                </span>
            </span>
        );
    }

    const time = unit.ExchangeRateTime;

    // If input amount is a string, we replace it by 0 for formatting purpose, then we'll use the string in the jsx template
    const amount = isStringAmount ? 0 : convertAmount(_amount, COMPUTE_BITCOIN_UNIT, unit);

    const currency = unit.FiatCurrency;
    const formatter =
        formatterByCurrency.get(unit.FiatCurrency) ?? tryNumberFormat(unit.FiatCurrency, Math.log10(unit.Cents));
    if (!formatterByCurrency.has(unit.FiatCurrency)) {
        formatterByCurrency.set(unit.FiatCurrency, formatter);
    }

    const parts = formatter
        .formatToParts(amount)
        .filter(({ type }) =>
            ['plusSign', 'minusSign', 'currency', 'integer', 'group', 'decimal', 'fraction', 'literal'].includes(type)
        );

    const currencyIndex = parts.findIndex((part) => part.type === 'currency');

    const isCurrencyBeforeAmount = currencyIndex < parts.findIndex((part) => part.type === 'integer');

    const [visibleParts, hiddenParts] = isCurrencyBeforeAmount
        ? // $20 -> 0 is visible / 1.. is hidden
          [[0, currencyIndex + 1], [currencyIndex + 1]]
        : // 20€ -> 2.. is visible / 0..2 is hidden
          [[currencyIndex], [0, currencyIndex]];

    const jsxParts = partsToJsx({
        parts,
        amount,
        withPositiveSign,
        signClassName,
        amountClassName,
        currencyClassName,
        classNames,
        time,
        isStringAmount,
        currency,
    });

    return (
        <span
            className={clsx([
                'price',
                wrapperClassName,
                large && 'price--large',
                classNames?.price,
                className,
                `flex ${isCurrencyBeforeAmount ? 'flex-row' : 'flex-row-reverse'}`,
            ])}
            data-currency={currency}
            key={`${time}-${_amount}-${currency}`}
            data-testid={props?.['data-testid']}
        >
            <span>{jsxParts.slice(...visibleParts)}</span>

            <span>
                <MaybeHiddenAmount preventHideAmount={preventHideAmount}>
                    {jsxParts.slice(...hiddenParts)}
                </MaybeHiddenAmount>
            </span>
        </span>
    );
};
