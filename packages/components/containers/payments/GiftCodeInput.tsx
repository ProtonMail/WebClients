import React from 'react';
import { isValid } from 'proton-shared/lib/helpers/giftCode';
import { c } from 'ttag';

import { Input } from '../../components';

interface Props {
    value: string;
}

const GiftCodeInput = ({ value, ...rest }: Props) => {
    const error = isValid(value) ? undefined : c('Error').t`Invalid gift code`;
    return <Input placeholder={c('Placeholder').t`Gift code`} error={error} value={value} {...rest} />;
};

export default GiftCodeInput;
