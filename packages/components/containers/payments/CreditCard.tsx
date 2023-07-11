import { ChangeEvent, useMemo } from 'react';

import { c } from 'ttag';

import { Info, InputFieldTwo, Select } from '../../components';
import { DEFAULT_SEPARATOR, getFullList } from '../../helpers/countries';
import { CardModel } from '../../payments/core';
import CardNumberInput from './CardNumberInput';
import ExpInput from './ExpInput';

interface Props {
    onChange: (key: keyof CardModel, value: string) => void;
    loading?: boolean;
    card: CardModel;
    errors: Partial<CardModel>;
}

const CreditCard = ({ card, errors, onChange, loading = false }: Props) => {
    const countries = useMemo(
        () => getFullList().map(({ key, value, label: text, disabled }) => ({ key, value, text, disabled })),
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
