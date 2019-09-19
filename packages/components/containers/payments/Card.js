import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Block, Input, Select } from 'react-components';

import { getFullList } from '../../helpers/countries';
import ExpInput from './ExpInput';
import CardNumberInput from './CardNumberInput';

const Card = ({ card, errors, onChange, loading = false }) => {
    const countries = getFullList().map(({ value, label: text }) => ({ value, text }));
    const handleChange = (key) => ({ target }) => onChange(key, target.value);

    return (
        <>
            <Block>
                <Input
                    autoComplete="cc-name"
                    name="ccname"
                    value={card.fullname}
                    onChange={handleChange('fullname')}
                    placeholder={c('Placeholder').t`Full name`}
                    error={errors.fullname}
                    disabled={loading}
                    required
                />
            </Block>
            <Block>
                <CardNumberInput
                    value={card.number}
                    onChange={(value) => onChange('number', value)}
                    error={errors.number}
                    disabled={loading}
                    required
                />
            </Block>
            <div className="flex-autogrid">
                <div className="flex-autogrid-item ">
                    <ExpInput
                        month={card.month}
                        year={card.year}
                        error={errors.month}
                        disabled={loading}
                        onChange={({ month, year }) => {
                            onChange('month', month);
                            onChange('year', year);
                        }}
                    />
                </div>
                <div className="flex-autogrid-item">
                    <Input
                        autoComplete="cc-csc"
                        name="cvc"
                        value={card.cvc}
                        onChange={handleChange('cvc')}
                        placeholder={c('Placeholder, make it short').t`Security code`}
                        error={errors.cvc}
                        disabled={loading}
                        required
                    />
                </div>
            </div>
            <div className="flex-autogrid">
                <div className="flex-autogrid-item">
                    <Select
                        value={card.country}
                        onChange={handleChange('country')}
                        options={countries}
                        disabled={loading}
                        autoComplete="country"
                    />
                </div>
                <div className="flex-autogrid-item">
                    <Input
                        autoComplete="postal-code"
                        value={card.zip}
                        onChange={handleChange('zip')}
                        placeholder={card.country === 'US' ? c('Placeholder').t`ZIP` : c('Placeholder').t`Postal code`}
                        title={c('Title').t`ZIP / postal code`}
                        error={errors.zip}
                        disabled={loading}
                        minLength={3}
                        maxLength={9}
                        required
                    />
                </div>
            </div>
        </>
    );
};

Card.propTypes = {
    loading: PropTypes.bool,
    card: PropTypes.object.isRequired,
    errors: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
};

export default Card;
