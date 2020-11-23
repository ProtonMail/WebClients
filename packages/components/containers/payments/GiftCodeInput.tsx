import React from 'react';
import { c } from 'ttag';

import { Input } from '../../components';

interface Props {
    value: string;
}

const GiftCodeInput = ({ value, ...rest }: Props) => {
    return <Input placeholder={c('Placeholder').t`Gift code`} value={value} {...rest} />;
};

export default GiftCodeInput;
