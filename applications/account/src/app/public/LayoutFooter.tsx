import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getPrivacyPolicyURL } from '@proton/shared/lib/helpers/url';

import { getLocaleTermsURL } from '../content/helper';

interface FooterProps {
    className?: string;
    version: string;
    app: APP_NAMES;
}

const LayoutFooter = ({ className, app, version }: FooterProps) => {
    return (
        <footer className={className}>
            <div>
                {
                    // translator: full sentence 'Proton. Privacy by default.'
                    c('Footer').t`${BRAND_NAME}. Privacy by default.`
                }
            </div>
            <div className="text-center m-0 pt-4 pb-0 sm:pb-4 shrink-0">
                <span className="block sm:inline">
                    <Href key="terms" className="signup-link link-focus" href={getLocaleTermsURL(app)}>
                        {c('Link').t`Terms`}
                    </Href>
                </span>
                <span className="color-border px-2 hidden sm:inline" aria-hidden="true">
                    |
                </span>
                <span className="block sm:inline">
                    <Href key="privacy" className="signup-link link-focus old-link" href={getPrivacyPolicyURL(app)}>{c(
                        'Link'
                    ).t`Privacy policy`}</Href>
                </span>
                <span className="color-border px-2 hidden sm:inline" aria-hidden="true">
                    |
                </span>
                <span className="hidden sm:inline">{c('Info').jt`Version ${version}`}</span>
            </div>
        </footer>
    );
};

export default LayoutFooter;
