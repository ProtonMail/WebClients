import { ChangeEvent, useMemo } from 'react';

import { c } from 'ttag';

import { Info, InputFieldTwo, Select } from '../../components';
import { DEFAULT_SEPARATOR, getFullList } from '../../helpers/countries';
import CardNumberInput from './CardNumberInput';
import ExpInput from './ExpInput';
import { CardModel } from './interface';

interface Props {
    onChange: (key: string, value: string) => void;
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
            />
            <InputFieldTwo
                label={c('Label').t`Card number`}
                id="ccnumber"
                as={CardNumberInput}
                value={card.number}
                onChange={(value: string) => onChange('number', value)}
                error={errors.number}
                disableChange={loading}
            />
            <div className="flex flex-justify-space-between on-tiny-mobile-flex-column">
                <div className="flex-item-fluid mr0-5 on-tiny-mobile-mr0">
                    <InputFieldTwo
                        label={c('Label').t`Expiration date`}
                        id="exp"
                        as={ExpInput}
                        month={card.month}
                        year={card.year}
                        error={errors.month}
                        disableChange={loading}
                        onChange={({ month, year }: { month: string; year: string }) => {
                            onChange('month', month);
                            onChange('year', year);
                        }}
                    />
                </div>
                <div className="flex-item-fluid ml0-5 on-tiny-mobile-ml0">
                    <InputFieldTwo
                        label={
                            <>
                                <span className="mr0-25">{c('Label').t`Security code`}</span>
                                <Info
                                    title={c('Info')
                                        .t`For Visa and MasterCard, the 3 digits on the back of your card. For American Express, the 4 digits on the front of your card.`}
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
                    />
                </div>
            </div>
            <div className="flex flex-justify-space-between mb1 on-tiny-mobile-flex-column">
                <div className="flex-item-fluid mr0-5 on-tiny-mobile-mr0">
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
                    />
                </div>
                <div className="flex-item-fluid ml0-5 on-tiny-mobile-ml0">
                    <InputFieldTwo
                        label={card.country === 'US' ? c('Label').t`ZIP code` : c('Label').t`Postal code`}
                        id="postalcode"
                        autoComplete="postal-code"
                        value={card.zip}
                        onChange={handleChange('zip')}
                        placeholder={card.country === 'US' ? c('Placeholder').t`ZIP` : c('Placeholder').t`Postal code`}
                        title={c('Title').t`ZIP / postal code`}
                        error={errors.zip}
                        disableChange={loading}
                        minLength={3}
                        maxLength={9}
                    />
                </div>
            </div>
        </>
    );
};

export default CreditCard;
