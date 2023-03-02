import { c } from 'ttag';

import { EMAIL_PLACEHOLDER } from '@proton/shared/lib/constants';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';

import Input, { Props } from './Input';

const EmailInput = ({ value = '', ...rest }: Props) => {
    const error = value ? (validateEmailAddress(value as string) ? '' : c('Error').t`Invalid email address`) : '';
    return <Input type="email" error={error} placeholder={EMAIL_PLACEHOLDER} value={value} {...rest} />;
};

export default EmailInput;
