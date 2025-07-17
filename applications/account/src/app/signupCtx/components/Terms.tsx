import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { getPrivacyPolicyURL } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';

import { getLocaleTermsURL } from '../../content/helper';
import { useSignup } from '../context/SignupContext';

const Terms = ({ className }: { className?: string }) => {
    const { app } = useSignup();

    const termsApp = (() => {
        if (app === 'generic') {
            return undefined;
        }
        return app;
    })();

    const termsAndConditionsLink = (
        <Href className="color-weak" key="terms" href={getLocaleTermsURL(termsApp)}>
            {
                // translator: Full sentence "By continuing, you agree to our terms and conditions and privacy policy."
                c('new_plans: signup').t`terms and conditions`
            }
        </Href>
    );

    const privacyPolicyLink = (
        <Href className="color-weak" key="privacy" href={getPrivacyPolicyURL(termsApp)}>
            {
                // translator: Full sentence "By continuing, you agree to our terms and conditions and privacy policy."
                c('Link').t`privacy policy`
            }
        </Href>
    );

    return (
        <div className={clsx('text-sm color-weak text-center', className)}>
            {
                // translator: Full sentence "By continuing, you agree to our terms and conditions and privacy policy."
                c('pass_signup_2023: Info')
                    .jt`By continuing, you agree to our ${termsAndConditionsLink} and ${privacyPolicyLink}.`
            }
        </div>
    );
};

export default Terms;
