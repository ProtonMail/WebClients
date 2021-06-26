import React from 'react';
import { c } from 'ttag';
import { APPS } from 'proton-shared/lib/constants';
import envelopSvg from 'design-system/assets/img/placeholders/welcome-pane.svg';
import { Alert } from '../../components';
import { useConfig } from '../../hooks';

const Cash = () => {
    const { APP_NAME } = useConfig();
    const email = (
        <b key="email-contact">
            {APP_NAME === APPS.PROTONVPN_SETTINGS ? 'contact@protonvpn.com' : 'contact@protonmail.com'}
        </b>
    );

    return (
        <div className="p1 bordered bg-weak mb1">
            <Alert>{c('Info for cash payment method')
                .jt`Please contact us at ${email} for instructions on how to pay us with cash.`}</Alert>
            <div className="text-center">
                <img src={envelopSvg} alt="" />
            </div>
        </div>
    );
};

export default Cash;
