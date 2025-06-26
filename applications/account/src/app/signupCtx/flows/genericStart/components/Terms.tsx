import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { APPS } from '@proton/shared/lib/constants';
import { getPrivacyPolicyURL } from '@proton/shared/lib/helpers/url';

import { getLocaleTermsURL } from '../../../../content/helper';

const termsAndConditionsLink = (
    <Href className="color-weak" key="terms" href={getLocaleTermsURL(APPS.PROTONDRIVE)}>
        {
            // translator: Full sentence "By continuing, you agree to our terms and conditions and privacy policy."
            c('new_plans: signup').t`terms and conditions`
        }
    </Href>
);

const privacyPolicyLink = (
    <Href className="color-weak" key="privacy" href={getPrivacyPolicyURL(APPS.PROTONDRIVE)}>
        {
            // translator: Full sentence "By continuing, you agree to our terms and conditions and privacy policy."
            c('Link').t`privacy policy`
        }
    </Href>
);

const Terms = () => (
    <div className="mt-4 text-sm color-weak text-center">
        {
            // translator: Full sentence "By continuing, you agree to our terms and conditions and privacy policy."
            c('pass_signup_2023: Info')
                .jt`By continuing, you agree to our ${termsAndConditionsLink} and ${privacyPolicyLink}.`
        }
    </div>
);

export default Terms;
