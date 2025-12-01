import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { getPrivacyPolicyURL, getStaticURL } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';
import { useSignup } from '../../../context/SignupContext';
import { getLocaleTermsURL } from '../../../../content/helper';

const Terms = ({ className }: { className?: string }) => {
    const { app } = useSignup();

    const termsApp = (() => {
        if (app === 'generic') {
            return undefined;
        }
        return app;
    })();

    const referralPolicyURL = getStaticURL('/legal/terms-referral-program');

    const termsAndConditionsLink = (
        <Href className="color-weak" key="terms" href={getLocaleTermsURL(termsApp)}>
            {
                // translator: Full sentence "By continuing, you accept our terms of services, our privacy policy, and the terms of our referral program."
                c('new_plans: signup').t`terms and conditions`
            }
        </Href>
    );

    const privacyPolicyLink = (
        <Href className="color-weak" key="privacy" href={getPrivacyPolicyURL(termsApp)}>
            {
                // translator: Full sentence "By continuing, you accept our terms of services, our privacy policy, and the terms of our referral program."
                c('Link').t`privacy policy`
            }
        </Href>
    );

    const referralPolicyLink = (
        <Href className="color-weak" key="referral" href={referralPolicyURL}>
            {
                // translator: Full sentence "By continuing, you accept our terms of services, our privacy policy, and the terms of our referral program."
                c('Link').t`terms of our referral program`
            }
        </Href>
    );

    return (
        <div className={clsx('text-sm color-weak text-center', className)}>
            {
                // translator: Full sentence "By continuing, you accept our terms of services, our privacy policy, and the terms of our referral program."
                c('pass_signup_2023: Info')
                    .jt`By continuing, you agree to our ${termsAndConditionsLink}, our ${privacyPolicyLink} and the ${referralPolicyLink}.`
            }
        </div>
    );
};

export default Terms;
