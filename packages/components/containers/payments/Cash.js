import React from 'react';
import { c } from 'ttag';
import { Alert, useConfig } from 'react-components';
import { APPS } from 'proton-shared/lib/constants';

const { PROTONVPN_SETTINGS } = APPS;

const Cash = () => {
    const { APP_NAME } = useConfig();
    const email = APP_NAME === PROTONVPN_SETTINGS ? 'contact@protonvpn.com' : 'contact@protonmail.com';

    return (
        <Alert>{c('Info for cash payment method')
            .t`To pay via Cash, please email us at ${email} for instructions.`}</Alert>
    );
};

export default Cash;
