import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { PrimaryButton, GiftCodeInput } from 'react-components';

const GiftCodeForm = ({ onChange, model }) => {
    const [gift, setGift] = useState(model.gift || '');
    const handleChange = ({ target }) => setGift(target.value);
    const handleClick = () => onChange({ ...model, gift }, true);

    return (
        <div className="flex">
            <div className="mr1">
                <GiftCodeInput value={gift} onChange={handleChange} />
            </div>
            <div>
                <PrimaryButton onClick={handleClick}>{c('Action').t`Apply`}</PrimaryButton>
            </div>
        </div>
    );
};

GiftCodeForm.propTypes = {
    onChange: PropTypes.func.isRequired,
    model: PropTypes.object.isRequired
};

export default GiftCodeForm;
