import React from 'react';
import { c } from 'ttag';
import { Alert, useConfig } from 'react-components';
import { CLIENT_TYPES } from 'proton-shared/lib/constants';

const { VPN } = CLIENT_TYPES;

const Cash = () => {
    const { CLIENT_TYPE } = useConfig();
    const email = CLIENT_TYPE === VPN ? 'contact@protonvpn.com' : 'contact@protonmail.com';

    return (
        <Alert>{c('Info for cash payment method')
            .t`To pay via Cash, please email us at ${email} for instructions.`}</Alert>
    );
};

export default Cash;
