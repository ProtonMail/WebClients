import { c } from 'ttag';
import React from 'react';
import { getLightOrDark } from 'proton-shared/lib/themes/helpers';
import americanExpressSafekeySvgLight from 'design-system/assets/img/shared/bank-icons/american-express-safekey.svg';
import americanExpressSafekeySvgDark from 'design-system/assets/img/shared/bank-icons/american-express-safekey-dark.svg';
import discoverProtectBuySvgLight from 'design-system/assets/img/shared/bank-icons/discover-protectbuy.svg';
import discoverProtectBuySvgDark from 'design-system/assets/img/shared/bank-icons/discover-protectbuy-dark.svg';
import mastercardSecurecodeSvg from 'design-system/assets/img/shared/bank-icons/mastercard-securecode.svg';
import verifiedByVisaSvgLight from 'design-system/assets/img/shared/bank-icons/verified-by-visa.svg';
import verifiedByVisaSvgDark from 'design-system/assets/img/shared/bank-icons/verified-by-visa-dark.svg';

const Alert3ds = () => {
    const verifiedByVisaSvg = getLightOrDark(verifiedByVisaSvgLight, verifiedByVisaSvgDark);
    const discoverProtectBuySvg = getLightOrDark(discoverProtectBuySvgLight, discoverProtectBuySvgDark);
    const americanExpressSafekeySvg = getLightOrDark(americanExpressSafekeySvgLight, americanExpressSafekeySvgDark);
    return (
        <p>
            <div className="mb0-5">{c('Info').t`We use 3-D Secure to protect your payments.`}</div>
            <div className="flex flex-nowrap flex-align-items-center">
                <img width="60" alt="" className="mr1" src={verifiedByVisaSvg} />
                <img width="60" alt="" className="mr1" src={mastercardSecurecodeSvg} />
                <img width="60" alt="" className="mr1" src={discoverProtectBuySvg} />
                <img width="60" alt="" className="mr1" src={americanExpressSafekeySvg} />
            </div>
        </p>
    );
};

export default Alert3ds;
