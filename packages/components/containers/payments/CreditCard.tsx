import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import valid from 'card-validator';
import { c } from 'ttag';

import { Input } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import type { SelectChangeEvent } from '@proton/components/components/selectTwo/select';
import { requestAnimationFrameRateLimiter, default as useElementRect } from '@proton/components/hooks/useElementRect';
import { formatCreditCardNumber, isValidNumber } from '@proton/components/payments/client-extensions/credit-card-type';
import type { CardFieldStatus } from '@proton/components/payments/react-extensions/useCard';
import type { CardModel } from '@proton/payments';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';
import { isNumber } from '@proton/shared/lib/helpers/validators';
import clsx from '@proton/utils/clsx';

import { Label, Option, SelectTwo } from '../../components';
import { DEFAULT_SEPARATOR, getFullList } from '../../helpers/countries';

import './CreditCard.scss';

const isPotentiallyCVV = (value: string, maxLength: number) => valid.cvv(value, maxLength).isPotentiallyValid;
const isValidMonth = (m: string) => !m || (isNumber(m) && m.length <= 2);
const isValidYear = (y: string) => !y || (isNumber(y) && y.length <= 4);

const handleExpOnChange = (newValue: string, prevMonth: string, prevYear: string) => {
    const [newMonth = '', newYear = ''] = newValue.split('/');

    if (newValue.includes('/')) {
        return {
            month: isValidMonth(newMonth) ? newMonth : prevMonth,
            year: isValidYear(newYear) ? newYear : prevYear,
        };
    }

    if (newMonth.length > 2) {
        // User removes the '/'
        return;
    }

    if (prevMonth.length === 2) {
        // User removes the '/' and year is empty
        const [first = ''] = newMonth;
        return {
            year: '',
            month: isValidMonth(first) ? first : prevMonth,
        };
    }

    const [first = '', second = ''] = newMonth;
    return {
        year: '',
        month: isValidMonth(`${first}${second}`) ? `${first}${second}` : prevMonth,
    };
};

const WarningIcon = ({ className }: { className?: string }) => {
    return <Icon name="exclamation-circle-filled" className={clsx('shrink-0 color-danger', className)} size={4.5} />;
};

export interface Props {
    setCardProperty: (key: keyof CardModel, value: string) => void;
    loading?: boolean;
    card: CardModel;
    errors: Partial<CardModel>;
    fieldsStatus: CardFieldStatus;
    bigger?: boolean;
    forceNarrow?: boolean;
}

/**
 * The hook will focus the next field if the current field is filled and the condition is true.
 * The codition typically should be true when the current field is valid.
 */
const useAdvancer = (
    currentElementRef: React.RefObject<HTMLInputElement>,
    nextElementRef: React.RefObject<HTMLInputElement>,
    currentFieldState: string,
    condition: boolean
) => {
    const [advanced, setAdvanced] = useState(false);

    useEffect(() => {
        const currentElementFocused = document.activeElement === currentElementRef.current;
        if (condition && currentElementFocused && nextElementRef.current && !advanced) {
            nextElementRef.current.focus();
            setAdvanced(true);
        }
    }, [currentFieldState, condition]);
};

const CreditCard = ({
    card,
    errors,
    setCardProperty: onChange,
    loading = false,
    fieldsStatus,
    bigger = false,
    forceNarrow = false,
}: Props) => {
    const narrowNumberRef = useRef<HTMLInputElement>(null);
    const narrowExpRef = useRef<HTMLInputElement>(null);
    const narrowCvcRef = useRef<HTMLInputElement>(null);

    const wideNumberRef = useRef<HTMLInputElement>(null);
    const wideExpRef = useRef<HTMLInputElement>(null);
    const wideCvcRef = useRef<HTMLInputElement>(null);

    const zipRef = useRef<HTMLInputElement>(null);

    useAdvancer(narrowNumberRef, narrowExpRef, card.number, fieldsStatus?.number ?? false);
    useAdvancer(narrowExpRef, narrowCvcRef, card.month, fieldsStatus?.month ?? false);
    useAdvancer(narrowCvcRef, zipRef, card.cvc, fieldsStatus?.cvc ?? false);

    useAdvancer(wideNumberRef, wideExpRef, card.number, fieldsStatus?.number ?? false);
    useAdvancer(wideExpRef, wideCvcRef, card.month, fieldsStatus?.month ?? false);
    useAdvancer(wideCvcRef, zipRef, card.cvc, fieldsStatus?.cvc ?? false);

    const formContainer = useRef<HTMLDivElement>(null);
    const formRect = useElementRect(formContainer, requestAnimationFrameRateLimiter);

    const countries = useMemo(() => getFullList(), []);

    const maxCvvLength = 4;
    const handleChange =
        (key: keyof CardModel) =>
        ({ target }: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLSelectElement>) => {
            const newValue = target.value;

            // todo: if the new design is widely adopted or at least stabilized by several weeks in prod,
            // then make this logic as part of credit card validation overall, i.e. apply it to getErrors() in useCard() hook
            const isInvalid = key === 'cvc' && !isPotentiallyCVV(newValue, maxCvvLength);
            if (isInvalid) {
                return;
            }

            onChange(key, newValue);
        };

    // translator: this is the pattern for bank card expiration MM/YY, where MM stands for Month Month and YY Year Year. Please keep the slash in the middle.
    const patternExpiration = c('Info').t`MM/YY`;

    // translator: this is a ZIP code used for american credit cards
    const zipCode = c('Label, credit card').t`ZIP code`;
    const title = card.country === 'US' ? zipCode : c('Label').t`Postal code`;

    const commonNumberProps = {
        id: 'ccnumber',
        'data-testid': 'ccnumber',
        disableChange: loading,
        autoComplete: 'cc-number',
        name: 'cardnumber',
        maxLength: 23,
    };

    const commonExpProps = {
        id: 'exp',
        disableChange: loading,
        placeholder: patternExpiration,
        'data-testid': 'exp',
        autoComplete: 'cc-exp',
        maxLength: 5,
    };

    const commonCvcProps = {
        autoComplete: 'cc-csc',
        id: 'cvc',
        name: 'cvc',
        'data-testid': 'cvc',
        value: card.cvc,
        onChange: handleChange('cvc'),
        disableChange: loading,
        maxLength: maxCvvLength,
    };

    const { valueWithGaps, bankIcon, niceType, codeName } = formatCreditCardNumber(card.number);
    const { month, year } = card;

    // 25 x 16 = we want eq 400px width to trigger the adaptation being zoom-friendly
    const narrowWidth = rootFontSize() * 25;
    const isNarrow = forceNarrow || (formRect ? formRect.width < narrowWidth : false);

    let error = null;
    if (errors.number) {
        error = (
            <span data-testid="error-ccnumber" id="error-ccnumber">
                {errors.number}
            </span>
        );
    } else if (errors.month) {
        error = (
            <span data-testid="error-exp" id="error-exp">
                {errors.month}
            </span>
        );
    } else if (errors.cvc) {
        error = (
            <span data-testid="error-cvc" id="error-cvc">
                {errors.cvc}
            </span>
        );
    }

    let creditCardForm;
    if (isNarrow) {
        const cardNumberSuffix = (() => {
            if (errors.number) {
                return <WarningIcon />;
            }

            if (card.number && bankIcon) {
                return <img src={bankIcon} title={niceType} alt={niceType} width="24" />;
            }

            return <Icon name="credit-card" size={4} className="mr-1" />;
        })();

        creditCardForm = (
            <>
                <Label
                    htmlFor={commonNumberProps.id}
                    className="field-two-label field-two-label-container flex pt-3"
                >{c('Label').t`Card details`}</Label>
                <span id="id_desc_card_number" className="sr-only">{c('Label').t`Card number`}</span>
                <Input
                    className="card-number--small"
                    inputClassName="px-3"
                    placeholder={c('Label').t`Card number`}
                    aria-describedby="id_desc_card_number error-ccnumber"
                    value={valueWithGaps}
                    error={errors.number}
                    onChange={({ target }) => {
                        const val = target.value.replace(/\s/g, '');
                        if (isValidNumber(val)) {
                            onChange('number', val);
                        }
                    }}
                    suffix={cardNumberSuffix}
                    ref={narrowNumberRef}
                    {...commonNumberProps}
                />
                <div className="flex">
                    <Label htmlFor={commonExpProps.id} className="sr-only">{c('Label')
                        .t`Expiration (${patternExpiration})`}</Label>
                    <Input
                        inputClassName="px-3"
                        className="exp exp--small"
                        aria-describedby="error-exp"
                        value={`${month}${month.length === 2 || year.length ? '/' : ''}${year}`}
                        error={errors.month}
                        onChange={({ target }) => {
                            const change = handleExpOnChange(target.value, month, year);
                            if (change) {
                                onChange('month', change.month);
                                onChange('year', change.year);
                            }
                        }}
                        ref={narrowExpRef}
                        suffix={errors.month ? <WarningIcon /> : null}
                        {...commonExpProps}
                    />
                    <Label htmlFor={commonCvcProps.id} className="sr-only">{c('Label')
                        .t`Security code (${codeName})`}</Label>
                    <Input
                        placeholder={codeName}
                        inputClassName="px-3"
                        className="cvv cvv--small"
                        aria-describedby="error-cvc"
                        ref={narrowCvcRef}
                        error={errors.cvc}
                        suffix={errors.cvc ? <WarningIcon /> : null}
                        {...commonCvcProps}
                    />
                </div>
            </>
        );
    } else {
        creditCardForm = (
            <>
                <Label
                    htmlFor={commonNumberProps.id}
                    className="field-two-label field-two-label-container flex pt-3"
                >{c('Label').t`Card details`}</Label>
                <span id="id_desc_card_number" className="sr-only">{c('Label').t`Card number`}</span>
                <Input
                    className="card-information"
                    inputClassName="card-number"
                    placeholder={c('Label').t`Card number`}
                    value={valueWithGaps}
                    error={error}
                    aria-describedby="id_desc_card_number error-ccnumber"
                    onChange={({ target }) => {
                        const val = target.value.replace(/\s/g, '');
                        if (isValidNumber(val)) {
                            onChange('number', val);
                        }
                    }}
                    ref={wideNumberRef}
                    prefix={
                        <div className="ml-3 mr-1">
                            {card.number && bankIcon ? (
                                <img src={bankIcon} title={niceType} alt={niceType} width="32" />
                            ) : (
                                <Icon name="credit-card-detailed" size={8} />
                            )}
                        </div>
                    }
                    suffix={
                        <div className="flex mx-0">
                            <Label htmlFor={commonExpProps.id} className="sr-only">{c('Label')
                                .t`Expiration (${patternExpiration})`}</Label>
                            <Input
                                unstyled
                                inputClassName="mr-3 py-0.5 px-3 border-left border-right"
                                className="exp"
                                aria-describedby="error-exp"
                                value={`${month}${month.length === 2 || year.length ? '/' : ''}${year}`}
                                onChange={({ target }) => {
                                    const change = handleExpOnChange(target.value, month, year);
                                    if (change) {
                                        onChange('month', change.month);
                                        onChange('year', change.year);
                                    }
                                }}
                                ref={wideExpRef}
                                {...commonExpProps}
                            />

                            <Label htmlFor={commonCvcProps.id} className="sr-only">{c('Label')
                                .t`Security code (${codeName})`}</Label>
                            <Input
                                unstyled
                                placeholder={codeName}
                                aria-describedby="error-cvc"
                                inputClassName="p-0"
                                className="cvv"
                                ref={wideCvcRef}
                                {...commonCvcProps}
                            />
                        </div>
                    }
                    {...commonNumberProps}
                />
            </>
        );
    }

    return (
        <div
            ref={formContainer}
            data-testid="credit-card-form-container"
            className={clsx([
                'field-two-container',
                bigger && 'field-two--bigger',
                isNarrow && 'credit-card-form--narrow',
            ])}
        >
            {creditCardForm}
            <div className="error-container mt-1 text-semibold text-sm flex gap-2">
                {error && (
                    <div className="flex">
                        <WarningIcon className="mr-1" />
                        {error}
                    </div>
                )}
            </div>
            <Label htmlFor="postalcode" className="field-two-label field-two-label-container flex pt-1">{c('Label')
                .t`Billing address`}</Label>
            <Input
                placeholder={title}
                className="country-select justify-space-between divide-x"
                inputClassName="ml-1"
                prefixClassName="flex-1"
                ref={zipRef}
                prefix={
                    <SelectTwo
                        className="mx-3"
                        unstyled
                        onChange={
                            loading
                                ? undefined
                                : ({ value }: SelectChangeEvent<string>) => {
                                      if (value === DEFAULT_SEPARATOR.value) {
                                          return;
                                      }
                                      onChange('country', value);
                                  }
                        }
                        data-testid="country"
                        id="country"
                        value={card.country}
                    >
                        {countries.map(({ key, value, label, disabled }) => {
                            return (
                                <Option
                                    key={key}
                                    value={value}
                                    title={label}
                                    disabled={disabled}
                                    data-testid={`country-${value}`}
                                >
                                    {value === DEFAULT_SEPARATOR.value ? <hr className="m-0" /> : label}
                                </Option>
                            );
                        })}
                    </SelectTwo>
                }
                data-testid="postalCode"
                minLength={3}
                maxLength={9}
                autoComplete="postal-code"
                id="postalcode"
                aria-describedby="id_desc_postal"
                value={card.zip}
                onChange={handleChange('zip')}
                disableChange={loading}
                title={title}
                error={errors.zip}
                suffix={errors.zip ? <WarningIcon className="mr-2" /> : null}
            />
            <span className="sr-only" id="id_desc_postal">
                {title}
            </span>
            <div className="error-container mt-1 mb-3 text-semibold text-sm flex">
                {errors.zip && (
                    <>
                        <WarningIcon className="mr-1" />
                        <span data-testid="error-postalCode">{errors.zip}</span>
                    </>
                )}
            </div>
        </div>
    );
};

export default CreditCard;
