import { ChangeEvent, useMemo, useRef } from 'react';

import { c } from 'ttag';

import { Input } from '@proton/atoms';
import { SelectChangeEvent } from '@proton/components/components/selectTwo/select';
import { requestAnimationFrameRateLimiter } from '@proton/components/hooks/useElementRect';

import { Icon, Info, InputFieldTwo, Label, Option, Select, SelectTwo } from '../../components';
import { DEFAULT_SEPARATOR, getFullList } from '../../helpers/countries';
import { useElementRect } from '../../hooks';
import { CardModel } from '../../payments/core/interface';
import CardNumberInput, { formatCreditCardNumber, isValidNumber } from './CardNumberInput';
import ExpInput, { handleExpOnChange } from './ExpInput';

import './CreditCard.scss';

interface Props {
    onChange: (key: keyof CardModel, value: string) => void;
    loading?: boolean;
    card: CardModel;
    errors: Partial<CardModel>;
    newDesign?: boolean;
}

const CreditCard = ({ card, errors, onChange, loading = false, newDesign = false }: Props) => {
    const newFormContainer = useRef<HTMLDivElement>(null);
    const newFormRect = useElementRect(newFormContainer, requestAnimationFrameRateLimiter);

    const countries = useMemo(
        () => getFullList().map(({ value, label: text, disabled }) => ({ value, text, disabled })),
        []
    );
    const handleChange =
        (key: keyof CardModel) =>
        ({ target }: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLSelectElement>) =>
            onChange(key, target.value);

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
    };

    const commonCountryProps = {
        autoComplete: 'country',
        'data-testid': 'country',
        id: 'country',
        value: card.country,
    };

    const commonZipProps = {
        'data-testid': 'postalCode',
        minLength: 3,
        maxLength: 9,
        autoComplete: 'postal-code',
        id: 'postalcode',
        value: card.zip,
        onChange: handleChange('zip'),
        disableChange: loading,
        title: title,
    };

    if (newDesign) {
        const { valueWithGaps, bankIcon, niceType, codeName } = formatCreditCardNumber(card.number);
        const { month, year } = card;

        const isNarrow = newFormRect ? newFormRect.width < 350 : false;

        let creditCardForm;
        if (isNarrow) {
            creditCardForm = (
                <>
                    <Label
                        htmlFor={commonNumberProps.id}
                        className="field-two-label field-two-label-container flex pt-3"
                    >{c('Label').t`Card information`}</Label>
                    <Input
                        className="card-number--small"
                        inputClassName="px-3"
                        placeholder={c('Label').t`Card number`}
                        value={valueWithGaps}
                        onChange={({ target }) => {
                            const val = target.value.replace(/\s/g, '');
                            if (isValidNumber(val)) {
                                onChange('number', val);
                            }
                        }}
                        suffix={
                            card.number && bankIcon ? (
                                <img src={bankIcon} title={niceType} alt={niceType} width="24" />
                            ) : (
                                <Icon name="credit-card" size={16} className="mr-1" />
                            )
                        }
                        {...commonNumberProps}
                    />
                    <div className="flex">
                        <Input
                            inputClassName="px-3"
                            className="exp exp--small"
                            value={`${month}${month.length === 2 || year.length ? '/' : ''}${year}`}
                            onChange={({ target }) => {
                                const change = handleExpOnChange(target.value, month, year);
                                if (change) {
                                    onChange('month', change.month);
                                    onChange('year', change.year);
                                }
                            }}
                            {...commonExpProps}
                        />
                        <Input
                            placeholder={codeName}
                            inputClassName="px-3"
                            className="cvv cvv--small"
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
                    >{c('Label').t`Card information`}</Label>
                    <Input
                        className="card-information"
                        inputClassName="card-number"
                        placeholder={c('Label').t`Card number`}
                        value={valueWithGaps}
                        onChange={({ target }) => {
                            const val = target.value.replace(/\s/g, '');
                            if (isValidNumber(val)) {
                                onChange('number', val);
                            }
                        }}
                        prefix={
                            <div className="ml-3 mr-1">
                                {card.number && bankIcon ? (
                                    <img src={bankIcon} title={niceType} alt={niceType} width="32" />
                                ) : (
                                    <Icon name="credit-card-detailed" size={32} />
                                )}
                            </div>
                        }
                        suffix={
                            <div className="flex mx-0">
                                <Input
                                    unstyled
                                    inputClassName="mr-3 py-0.5 px-3 border-left border-right"
                                    className="exp"
                                    value={`${month}${month.length === 2 || year.length ? '/' : ''}${year}`}
                                    onChange={({ target }) => {
                                        const change = handleExpOnChange(target.value, month, year);
                                        if (change) {
                                            onChange('month', change.month);
                                            onChange('year', change.year);
                                        }
                                    }}
                                    {...commonExpProps}
                                />
                                <Input
                                    unstyled
                                    placeholder={codeName}
                                    inputClassName="p-0"
                                    className="cvv"
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
            <div ref={newFormContainer}>
                {creditCardForm}
                <div className="error-container mt-1 text-semibold text-sm flex gap-2">
                    {errors.number && (
                        <div className="flex">
                            <Icon name="exclamation-circle-filled" className="flex-item-noshrink mr-1" />
                            <span data-testid="error-ccnumber">{errors.number}</span>
                        </div>
                    )}
                    {errors.month && (
                        <div className="flex">
                            <Icon name="exclamation-circle-filled" className="flex-item-noshrink mr-1" />
                            <span data-testid="error-exp">{errors.month}</span>
                        </div>
                    )}
                    {errors.cvc && (
                        <div className="flex">
                            <Icon name="exclamation-circle-filled" className="flex-item-noshrink mr-1" />
                            <span data-testid="error-cvc">{errors.cvc}</span>
                        </div>
                    )}
                </div>
                <Label
                    htmlFor={commonNumberProps.id}
                    className="field-two-label field-two-label-container flex pt-1"
                >{c('Label').t`Country`}</Label>
                <Input
                    placeholder={title}
                    className="country-select flex-justify-space-between divide-x"
                    inputClassName="ml-1"
                    prefixClassName="flex-item-fluid"
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
                            {...commonCountryProps}
                        >
                            {countries.map(({ value, text, disabled }) => {
                                return (
                                    <Option key={value} value={value} title={text} disabled={disabled}>
                                        {value === DEFAULT_SEPARATOR.value ? <hr className="m-0" /> : text}
                                    </Option>
                                );
                            })}
                        </SelectTwo>
                    }
                    {...commonZipProps}
                />
                <div className="error-container mt-1 text-semibold text-sm flex">
                    {errors.zip && (
                        <>
                            <Icon name="exclamation-circle-filled" className="flex-item-noshrink mr-1" />
                            <span data-testid="error-ccnumber">{errors.zip}</span>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <>
            <InputFieldTwo
                id="ccname"
                label={c('Label').t`Name on card`}
                autoComplete="cc-name"
                name="ccname"
                value={card.fullname}
                onChange={handleChange('fullname')}
                placeholder="Thomas Anderson"
                error={errors.fullname}
                disableChange={loading}
                data-testid="ccname"
            />
            <InputFieldTwo
                label={c('Label').t`Card number`}
                as={CardNumberInput}
                value={card.number}
                onChange={(value: string) => onChange('number', value)}
                error={errors.number}
                {...commonNumberProps}
            />
            <div className="flex flex-justify-space-between on-tiny-mobile-flex-column">
                <div className="flex-item-fluid mr-0 sm:mr-2">
                    <InputFieldTwo
                        label={c('Label').t`Expiration date`}
                        as={ExpInput}
                        month={card.month}
                        year={card.year}
                        error={errors.month}
                        hint={patternExpiration}
                        onChange={({ month, year }: { month: string; year: string }) => {
                            onChange('month', month);
                            onChange('year', year);
                        }}
                        {...commonExpProps}
                    />
                </div>
                <div className="flex-item-fluid ml-0 sm:ml-2">
                    <InputFieldTwo
                        label={
                            <>
                                <span className="mr-1">{c('Label').t`Security code`}</span>
                                <Info
                                    title={c('Info')
                                        .t`For Visa, MasterCard and Discover, the 3 digits on the back of your card. For American Express, the 4 digits on the front of your card.`}
                                />
                            </>
                        }
                        placeholder="000"
                        error={errors.cvc}
                        {...commonCvcProps}
                    />
                </div>
            </div>
            <div className="flex flex-justify-space-between mb-4 on-tiny-mobile-flex-column">
                <div className="flex-item-fluid mr-2 mr-0 sm:mr-2">
                    <InputFieldTwo
                        label={c('Label').t`Country`}
                        as={Select}
                        onChange={
                            loading
                                ? undefined
                                : (event: ChangeEvent<HTMLSelectElement>) => {
                                      const value = event.target.value;
                                      if (value === DEFAULT_SEPARATOR.value) {
                                          return;
                                      }
                                      onChange('country', value);
                                  }
                        }
                        options={countries}
                        title={c('Label').t`Select your country`}
                        {...commonCountryProps}
                    />
                </div>
                <div className="flex-item-fluid ml-0 sm:ml-2">
                    <InputFieldTwo label={title} placeholder={title} error={errors.zip} {...commonZipProps} />
                </div>
            </div>
        </>
    );
};

export default CreditCard;
