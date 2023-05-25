import { ChangeEvent, useMemo } from 'react';

import { c } from 'ttag';

import { Info, InputFieldTwo, Select } from '../../components';
import { DEFAULT_SEPARATOR, getFullList } from '../../helpers/countries';
import { CardModel } from '../../payments/core/interface';
import CardNumberInput from './CardNumberInput';
import ExpInput from './ExpInput';

interface Props {
    onChange: (key: keyof CardModel, value: string) => void;
    loading?: boolean;
    card: CardModel;
    errors: Partial<CardModel>;
}

const CreditCard = ({ card, errors, onChange, loading = false }: Props) => {
    const countries = useMemo(() => getFullList().map(({ value, label: text }) => ({ value, text })), []);
    const handleChange =
        (key: keyof CardModel) =>
        ({ target }: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLSelectElement>) =>
            onChange(key, target.value);

    // translator: this is the pattern for bank card expiration MM/YY, where MM stands for Month Month and YY Year Year. Please keep the slash in the middle.
    const patternExpiration = c('Info').t`MM/YY`;

    // translator: this is a ZIP code used for american credit cards
    const zipCode = c('Label, credit card').t`ZIP code`;
    const title = card.country === 'US' ? zipCode : c('Label').t`Postal code`;

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
                id="ccnumber"
                as={CardNumberInput}
                value={card.number}
                onChange={(value: string) => onChange('number', value)}
                error={errors.number}
                disableChange={loading}
                data-testid="ccnumber"
            />
            <div className="flex flex-justify-space-between on-tiny-mobile-flex-column">
                <div className="flex-item-fluid mr-0 sm:mr-2">
                    <InputFieldTwo
                        label={c('Label').t`Expiration date`}
                        id="exp"
                        as={ExpInput}
                        month={card.month}
                        year={card.year}
                        error={errors.month}
                        disableChange={loading}
                        hint={patternExpiration}
                        placeholder={patternExpiration}
                        data-testid="exp"
                        onChange={({ month, year }: { month: string; year: string }) => {
                            onChange('month', month);
                            onChange('year', year);
                        }}
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
                        autoComplete="cc-csc"
                        id="cvc"
                        name="cvc"
                        value={card.cvc}
                        onChange={handleChange('cvc')}
                        placeholder="000"
                        error={errors.cvc}
                        disableChange={loading}
                        data-testid="cvc"
                    />
                </div>
            </div>
            <div className="flex flex-justify-space-between mb-4 on-tiny-mobile-flex-column">
                <div className="flex-item-fluid mr-2 mr-0 sm:mr-2">
                    <InputFieldTwo
                        label={c('Label').t`Country`}
                        as={Select}
                        id="country"
                        value={card.country}
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
                        autoComplete="country"
                        title={c('Label').t`Select your country`}
                        data-testid="country"
                    />
                </div>
                <div className="flex-item-fluid ml-0 sm:ml-2">
                    <InputFieldTwo
                        label={title}
                        id="postalcode"
                        autoComplete="postal-code"
                        value={card.zip}
                        onChange={handleChange('zip')}
                        placeholder={title}
                        title={title}
                        error={errors.zip}
                        disableChange={loading}
                        minLength={3}
                        maxLength={9}
                        data-testid="postalCode"
                    />
                </div>
            </div>
        </>
    );
};

export default CreditCard;
