import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { APPS } from '@proton/shared/lib/constants';
import { getPrivacyPolicyURL } from '@proton/shared/lib/helpers/url';
import { locales } from '@proton/shared/lib/i18n/locales';

import { getLocaleTermsURL } from '../../../../../content/helper';
import LanguageSelect from '../../../../../public/LanguageSelect';
import SignupSupportDropdown from '../../../../../signup/SignupSupportDropdown';

export const Footer = () => (
    <footer
        className="flex justify-center items-center p-4 gap-8"
        style={{
            '--link-norm': 'var(--text-weak)',
            '--primary': 'var(--text-weak)',
            '--interaction-norm-major-1': 'var(--text-weak)',
        }}
    >
        <LanguageSelect locales={locales} globe={true} />
        <Href
            key="privacy"
            className="signup-link link-focus text-no-decoration"
            href={getPrivacyPolicyURL(APPS.PROTONDRIVE)}
        >{c('Link').t`Privacy policy`}</Href>
        <Href
            key="terms"
            className="signup-link link-focus text-no-decoration"
            href={getLocaleTermsURL(APPS.PROTONDRIVE)}
        >
            {c('Link').t`Terms`}
        </Href>
        <SignupSupportDropdown />
    </footer>
);
