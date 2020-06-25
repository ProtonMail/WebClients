import React from 'react';
import { c } from 'ttag';
import { validateEmailAddress } from 'proton-shared/lib/helpers/string';

import Input, { Props } from './Input';

const EmailInput = ({ value = '', ...rest }: Props) => {
    const error = validateEmailAddress(value as string) ? '' : c('Error').t`Email address invalid`;
    return <Input type="email" error={error} value={value} {...rest} />;
};

export default EmailInput;
