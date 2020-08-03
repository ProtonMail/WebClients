import React from 'react';
import { c } from 'ttag';
import { validateEmailAddress } from 'proton-shared/lib/helpers/email';
import { EMAIL_PLACEHOLDER } from 'proton-shared/lib/constants';

import Input, { Props } from './Input';

const EmailInput = ({ value = '', ...rest }: Props) => {
    const error = value ? (validateEmailAddress(value as string) ? '' : c('Error').t`Email address invalid`) : '';
    return <Input type="email" error={error} placeholder={EMAIL_PLACEHOLDER} value={value} {...rest} />;
};

export default EmailInput;
