import React from 'react';
import PropTypes from 'prop-types';
import ReactIntlTelInput from 'react-intl-tel-input';
import 'react-intl-tel-input/dist/main.css';
import { classnames } from '../../helpers/component';
import './IntlTelInput.scss';

const IntlTelInput = ({ containerClassName, inputClassName, ...rest }) => (
    <ReactIntlTelInput
        containerClassName={classnames(['intl-tel-input', containerClassName])}
        inputClassName={classnames(['pm-field', inputClassName])}
        {...rest}
    />
);

IntlTelInput.propTypes = {
    containerClassName: PropTypes.string,
    inputClassName: PropTypes.string
};

export default IntlTelInput;
