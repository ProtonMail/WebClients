import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { APPS } from '@proton/shared/lib/constants';
import { getPrivacyPolicyURL } from '@proton/shared/lib/helpers/url';

import { getLocaleTermsURL } from '../../../../content/helper';

const Terms = () => {
    const termsAndConditionsLink = (
        <Href className="color-weak text-underline" key="terms" href={getLocaleTermsURL(APPS.PROTONSPACES)}>
            {c('Link').t`terms and conditions`}
        </Href>
    );

    const privacyPolicyLink = (
        <Href className="color-weak text-underline" key="privacy" href={getPrivacyPolicyURL(APPS.PROTONSPACES)}>
            {c('Link').t`privacy policy`}
        </Href>
    );

    return (
        <div className="mt-3 text-sm lh130 color-weak text-center">
            {c('chat_2025: Spaces')
                .jt`By creating an account, you agree to our ${termsAndConditionsLink} and ${privacyPolicyLink}.`}
        </div>
    );
};

export default Terms;
