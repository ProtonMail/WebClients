import React from 'react';
import ReactIntlTelInput from 'react-intl-tel-input';
import './styles/_intlTelInput.scss';
import { classnames } from '../../../helpers';

interface TelInputProps {
    [key: string]: any;
}

interface Props extends TelInputProps {
    containerClassName: string;
    inputClassName: string;
    useNewFormStyle?: boolean;
}
const IntlTelInput = ({ containerClassName, inputClassName, useNewFormStyle = false, ...rest }: Props) => (
    <ReactIntlTelInput
        containerClassName={classnames(['intl-tel-input', containerClassName])}
        inputClassName={classnames([useNewFormStyle ? 'inputform-field' : 'field', inputClassName])}
        {...rest}
    />
);

export default IntlTelInput;
