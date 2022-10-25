import { c } from 'ttag';

import { Href } from '@proton/components/components';
import { APP_NAMES, BRAND_NAME } from '@proton/shared/lib/constants';
import { getPrivacyPolicyURL, getTermsURL } from '@proton/shared/lib/helpers/url';

interface FooterProps {
    className?: string;
    version: string;
    app: APP_NAMES;
}

const LayoutFooter = ({ className, app, version }: FooterProps) => {
    return (
        <footer className={className}>
            <div className="auto-mobile">
                {
                    // translator: full sentence 'Proton. Privacy by default.'
                    c('Footer').t`${BRAND_NAME}. Privacy by default.`
                }
            </div>
            <div className="text-center text-sm m0 pt1 pb0-5 on-tiny-mobile-pb0 flex-item-noshrink">
                <span className="auto-tiny-mobile">
                    <Href key="terms" className="signup-footer-link" href={getTermsURL(app)}>{c('Link').t`Terms`}</Href>
                </span>
                <span className="color-border pl0-75 pr0-75 no-tiny-mobile" aria-hidden="true">
                    |
                </span>
                <span className="auto-tiny-mobile">
                    <Href key="privacy" className="signup-footer-link old-link" href={getPrivacyPolicyURL(app)}>{c(
                        'Link'
                    ).t`Privacy policy`}</Href>
                </span>
                <span className="color-border pl0-75 pr0-75 no-tiny-mobile" aria-hidden="true">
                    |
                </span>
                <span className="no-tiny-mobile">{c('Info').jt`Version ${version}`}</span>
            </div>
        </footer>
    );
};

export default LayoutFooter;
