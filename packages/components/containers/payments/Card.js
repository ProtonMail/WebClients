import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Block, Input, Select } from 'react-components';
import { range } from 'proton-shared/lib/helpers/array';

import { getFullList } from '../../helpers/countries';

const Card = ({ card, errors, onChange, loading }) => {
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
                    value={card.fullname}
                    onChange={handleChange('fullname')}
                    placeholder={c('Placeholder').t`Name on card`}
                    error={errors.fullname}
                    disabled={loading}
                    required
                />
            </Block>
            <Block>
                <Input
                    value={card.number}
                    onChange={handleChange('number')}
                    placeholder={c('Placeholder').t`Card number`}
                    error={errors.number}
                    disabled={loading}
                    maxLength={20}
                    required
                />
            </Block>
            <div className="flex-autogrid">
                <div className="flex-autogrid-item">
                    <Select value={card.month} onChange={handleChange('month')} options={months} disabled={loading} />
                </div>
                <div className="flex-autogrid-item">
                    <Select value={card.year} onChange={handleChange('year')} options={years} disabled={loading} />
                </div>
                <div className="flex-autogrid-item">
                    <Input
                        value={card.cvc}
                        onChange={handleChange('cvc')}
                        placeholder={c('Placeholder').t`Security code`}
                        error={errors.cvc}
                        disabled={loading}
                        required
                    />
                </div>
            </div>
            <div className="flex-autogrid">
                <div className="flex-autogrid-item">
                    <Input
                        value={card.zip}
                        onChange={handleChange('zip')}
                        placeholder={c('Placeholder').t`ZIP/Postal code`}
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
    loading: PropTypes.bool.isRequired,
    card: PropTypes.object.isRequired,
    errors: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
};

Card.defaultProps = {
    loading: false
};

export default Card;
