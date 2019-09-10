import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Block, Input, Select } from 'react-components';
import { range } from 'proton-shared/lib/helpers/array';

import { getFullList } from '../../helpers/countries';

const Card = ({ disableNumber = false, card, errors, onChange, loading = false }) => {
    const countries = getFullList().map(({ value, label: text }) => ({ value, text }));
    const handleChange = (key) => ({ target }) => onChange(key, target.value);
    const currentYear = new Date().getFullYear();
    const months = range(1, 13).map((i) => {
        const value = `0${i}`.slice(-2);
        return { text: value, value };
    });
    const years = range(currentYear, currentYear + 12).map((i) => {
        const value = i.toString();
        return { text: value, value };
    });

    return (
        <>
            <Block>
                <Input
                    autocomplete="cc-name"
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
                <Input
                    autocomplete="cc-number"
                    value={card.number}
                    name="cardnumber"
                    onChange={handleChange('number')}
                    placeholder={c('Placeholder').t`Card number`}
                    error={errors.number}
                    disabled={loading || disableNumber}
                    maxLength={20}
                    required
                />
            </Block>
            <div className="flex-autogrid">
                <div className="flex-autogrid-item ">
                    <Select
                        value={card.month}
                        onChange={handleChange('month')}
                        options={months}
                        disabled={loading}
                        error={errors.month}
                    />
                </div>
                <div className="flex-autogrid-item ">
                    <Select value={card.year} onChange={handleChange('year')} options={years} disabled={loading} />
                </div>
                <div className="flex-autogrid-item">
                    <Input
                        autocomplete="cc-csc"
                        name="cvc"
                        value={card.cvc}
                        onChange={handleChange('cvc')}
                        placeholder={c('Placeholder').t`CVV`}
                        error={errors.cvc}
                        disabled={loading}
                        title={c('Title').t`Security code`}
                        required
                    />
                </div>
            </div>
            <div className="flex-autogrid">
                <div className="flex-autogrid-item">
                    <Input
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
                <div className="flex-autogrid-item">
                    <Select
                        value={card.country}
                        onChange={handleChange('country')}
                        options={countries}
                        disabled={loading}
                    />
                </div>
            </div>
        </>
    );
};

Card.propTypes = {
    disableNumber: PropTypes.bool,
    loading: PropTypes.bool,
    card: PropTypes.object.isRequired,
    errors: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
};

export default Card;
