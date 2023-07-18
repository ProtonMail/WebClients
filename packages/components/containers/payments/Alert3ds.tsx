import { c } from 'ttag';

import americanExpressSafekeySvg from '@proton/styles/assets/img/bank-icons/amex-safekey-colored.svg';
import discoverProtectBuySvg from '@proton/styles/assets/img/bank-icons/discover-protectbuy-colored.svg';
import mastercardSecurecodeSvg from '@proton/styles/assets/img/bank-icons/mastercard-securecode-colored.svg';
import verifiedByVisaSvg from '@proton/styles/assets/img/bank-icons/visa-secure-colored.svg';

const Alert3ds = () => {
    return (
        <div className="my-6 color-weak text-center">
            <div className="mb-2 text-sm" data-testid="3ds-info">
                {c('Info').t`We use 3-D Secure to protect your payments`}
            </div>
            <div className="flex flex-nowrap flex-align-items-center flex-justify-center">
                <img
                    alt={c('Info').t`Visa Secure logo`}
                    className="mr-4"
                    style={{ maxHeight: '44px' }}
                    src={verifiedByVisaSvg}
                />
                <img
                    alt={c('Info').t`Mastercard SecureCode logo`}
                    className="mr-4"
                    style={{ maxHeight: '44px' }}
                    src={mastercardSecurecodeSvg}
                />
                <img
                    alt={c('Info').t`Discover ProtectBuy logo`}
                    className="mr-4"
                    style={{ maxHeight: '44px' }}
                    src={discoverProtectBuySvg}
                />
                <img
                    alt={c('Info').t`American Express SafeKey logo`}
                    className="mr-4"
                    style={{ maxHeight: '44px' }}
                    src={americanExpressSafekeySvg}
                />
            </div>
        </div>
    );
};

export default Alert3ds;
