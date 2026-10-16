import type { FC } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { APPS } from '@proton/shared/lib/constants';
import { getPrivacyPolicyURL, getTermsURL } from '@proton/shared/lib/helpers/url';
import { localeCode } from '@proton/shared/lib/i18n';

import locales, { getLocaleMapping } from '../../../../locales';
import LanguageSelect from '../../../../public/LanguageSelect';
import SignupSupportDropdown from '../../../../signup/SignupSupportDropdown';

export const Footer: FC = () => (
    <footer
        className="flex justify-center items-center p-4 gap-x-8"
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
            href={getPrivacyPolicyURL(APPS.PROTONPASS)}
        >{c('Link').t`Privacy policy`}</Href>
        <Href
            key="terms"
            className="signup-link link-focus text-no-decoration"
            href={getTermsURL(APPS.PROTONPASS, getLocaleMapping(localeCode))}
        >
            {c('Link').t`Terms`}
        </Href>
        <SignupSupportDropdown />
    </footer>
);
