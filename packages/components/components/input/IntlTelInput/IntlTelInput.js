import React from 'react';
import PropTypes from 'prop-types';
import ReactIntlTelInput from 'react-intl-tel-input';
import './styles/_intlTelInput.scss';
import { classnames } from '../../../helpers';

const IntlTelInput = ({ containerClassName, inputClassName, ...rest }) => (
    <ReactIntlTelInput
        containerClassName={classnames(['intl-tel-input', containerClassName])}
        inputClassName={classnames(['field', inputClassName])}
        {...rest}
    />
);

IntlTelInput.propTypes = {
    containerClassName: PropTypes.string,
    inputClassName: PropTypes.string,
};

export default IntlTelInput;
