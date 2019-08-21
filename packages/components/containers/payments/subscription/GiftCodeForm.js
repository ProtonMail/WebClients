import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { PrimaryButton, GiftCodeInput, useNotifications } from 'react-components';
import { isValid } from 'proton-shared/lib/helpers/giftCode';

const GiftCodeForm = ({ onChange, model }) => {
    const { createNotification } = useNotifications();
    const [gift, setGift] = useState(model.gift || '');
    const handleChange = ({ target }) => setGift(target.value);

    const handleClick = () => {
        if (!isValid(gift)) {
            createNotification({ text: c('Error').t`Invalid gift code`, type: 'error' });
            return;
        }
        onChange({ ...model, gift }, true);
    };

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
