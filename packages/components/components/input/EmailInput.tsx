import React from 'react';
import { c } from 'ttag';
import { isEmail } from 'proton-shared/lib/helpers/validators';

import Input, { Props } from './Input';

const EmailInput = ({ value = '', ...rest }: Props) => {
    const error = isEmail(value as string) ? '' : c('Error').t`Email address invalid`;
    return <Input type="email" error={error} value={value} {...rest} />;
};

export default EmailInput;
