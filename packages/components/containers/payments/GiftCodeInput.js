import React from 'react';
import PropTypes from 'prop-types';
import { Input } from 'react-components';
import { isValid } from 'proton-shared/lib/helpers/giftCode';
import { c } from 'ttag';
import { GIFT_CODE_LENGTH } from 'proton-shared/lib/constants';

const GiftCodeInput = ({ value, ...rest }) => {
    const error = isValid(value) ? undefined : c('Error').t`Invalid gift code`;
    return (
        <Input
            maxLength={GIFT_CODE_LENGTH}
            minLength={GIFT_CODE_LENGTH}
            placeholder={c('Placeholder').t`Gift code`}
            error={error}
            value={value}
            {...rest}
        />
    );
};

GiftCodeInput.propTypes = {
    value: PropTypes.string
};

export default GiftCodeInput;
