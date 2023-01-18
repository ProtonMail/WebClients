import { c } from 'ttag';

import americanExpressSafekeySvg from '@proton/styles/assets/img/bank-icons/amex-safekey-colored.svg';
import discoverProtectBuyJpg from '@proton/styles/assets/img/bank-icons/discover-protectbuy-colored.jpg';
import mastercardSecurecodeSvg from '@proton/styles/assets/img/bank-icons/mastercard-securecode-colored.svg';
import verifiedByVisaSvg from '@proton/styles/assets/img/bank-icons/visa-secure-colored.svg';

const Alert3ds = () => {
    return (
        <div className="mt1-5 mb1-5 color-weak text-center">
            <div className="mb0-5">{c('Info').t`We use 3-D Secure to protect your payments.`}</div>
            <div className="flex flex-nowrap flex-align-items-center flex-justify-center">
                <img
                    alt={c('Info').t`Visa Secure logo`}
                    className="mr1"
                    style={{ maxHeight: '44px' }}
                    src={verifiedByVisaSvg}
                />
                <img
                    alt={c('Info').t`Mastercard SecureCode logo`}
                    className="mr1"
                    style={{ maxHeight: '44px' }}
                    src={mastercardSecurecodeSvg}
                />
                {/* Empirically found height for the discover logo */}
                <img
                    alt={c('Info').t`Discover ProtectBuy logo`}
                    className="mr1"
                    style={{ maxHeight: '34px' }}
                    src={discoverProtectBuyJpg}
                />
                <img
                    alt={c('Info').t`American Express SafeKey logo`}
                    className="mr1"
                    style={{ maxHeight: '44px' }}
                    src={americanExpressSafekeySvg}
                />
            </div>
        </div>
    );
};

export default Alert3ds;
