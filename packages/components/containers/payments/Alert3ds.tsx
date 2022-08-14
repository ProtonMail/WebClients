import { c } from 'ttag';

import americanExpressSafekeySvg from '@proton/styles/assets/img/bank-icons/amex-safekey-colored.svg';
import mastercardSecurecodeSvg from '@proton/styles/assets/img/bank-icons/mastercard-securecode-colored.svg';
import verifiedByVisaSvg from '@proton/styles/assets/img/bank-icons/visa-secure-colored.svg';

const Alert3ds = () => {
    return (
        <div className="mt1-5 mb1-5 color-weak text-center">
            <div className="mb0-5">{c('Info').t`We use 3-D Secure to protect your payments.`}</div>
            <div className="flex flex-nowrap flex-align-items-center flex-justify-center">
                <img height="44" alt="" className="mr1" src={verifiedByVisaSvg} />
                <img height="44" alt="" className="mr1" src={mastercardSecurecodeSvg} />
                <img height="44" alt="" className="mr1" src={americanExpressSafekeySvg} />
            </div>
        </div>
    );
};

export default Alert3ds;
