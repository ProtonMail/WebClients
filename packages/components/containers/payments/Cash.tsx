import React from 'react';
import { c } from 'ttag';
import { APPS } from 'proton-shared/lib/constants';
import { getLightOrDark } from 'proton-shared/lib/themes/helpers';
import envelopSvgLight from 'design-system/assets/img/shared/envelop.svg';
import envelopSvgDark from 'design-system/assets/img/shared/envelop-dark.svg';
import { Alert } from '../../components';
import { useConfig } from '../../hooks';

const Cash = () => {
    const { APP_NAME } = useConfig();
    const envelopSvg = getLightOrDark(envelopSvgLight, envelopSvgDark);
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
