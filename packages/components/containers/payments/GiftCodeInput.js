import React from 'react';
import PropTypes from 'prop-types';
import { Input } from 'react-components';
import { isValid } from 'proton-shared/lib/helpers/giftCode';
import { c } from 'ttag';

const GiftCodeInput = ({ value, ...rest }) => {
    const error = isValid(value) ? undefined : c('Error').t`Invalid gift code`;
    return <Input placeholder="AAAA-BBBB-CCCC-DDDD" error={error} {...rest} />;
};

GiftCodeInput.propTypes = {
    value: PropTypes.string
};

export default GiftCodeInput;
