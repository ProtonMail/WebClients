import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';

const TERMS_BORN_PRIVATE_URL = 'https://proton.me/legal/terms-born-private';
const PRIVACY_POLICY_URL = 'https://proton.me/legal/privacy';

const BornPrivateTerms = () => {
    const termsAndConditionsLink = (
        <Href className="color-weak" key="terms" href={TERMS_BORN_PRIVATE_URL}>
            {
                // translator: Full sentence "By continuing, you agree to our terms and conditions and privacy policy."
                c('new_plans: signup').t`terms and conditions`
            }
        </Href>
    );

    const privacyPolicyLink = (
        <Href className="color-weak" key="privacy" href={PRIVACY_POLICY_URL}>
            {
                // translator: Full sentence "By continuing, you agree to our terms and conditions and privacy policy."
                c('Link').t`privacy policy`
            }
        </Href>
    );

    return (
        <div className="text-sm color-weak text-center">
            {
                // translator: Full sentence "By continuing, you agree to our terms and conditions and privacy policy."
                c('pass_signup_2023: Info')
                    .jt`By continuing, you agree to our ${termsAndConditionsLink} and ${privacyPolicyLink}.`
            }
        </div>
    );
};

export default BornPrivateTerms;
