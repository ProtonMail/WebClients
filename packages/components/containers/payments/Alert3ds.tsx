import { c } from 'ttag';
import React from 'react';
import americanExpressSafekeySvg from '@proton/styles/assets/img/bank-icons/amex-safekey.svg';
import mastercardSecurecodeSvg from '@proton/styles/assets/img/bank-icons/mastercard-securecode.svg';
import verifiedByVisaSvg from '@proton/styles/assets/img/bank-icons/visa-secure.svg';

const Alert3ds = () => {
    return (
        <div className="mt1-5 mb1-5">
            <div className="mb0-5">{c('Info').t`We use 3-D Secure to protect your payments.`}</div>
            <div className="flex flex-nowrap flex-align-items-center">
                <img height="44" alt="" className="mr1" src={verifiedByVisaSvg} />
                <img height="44" alt="" className="mr1" src={mastercardSecurecodeSvg} />
                <img height="44" alt="" className="mr1" src={americanExpressSafekeySvg} />
            </div>
        </div>
    );
};

export default Alert3ds;
