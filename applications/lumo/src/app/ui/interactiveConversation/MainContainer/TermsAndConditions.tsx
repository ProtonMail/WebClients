import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

const TermsAndConditions = () => {
    return (
        <div className="fixed bottom-0 left-0 right-0 text-center py-5 z-1">
            <p className="text-sm color-weak m-0">
                {c('collider_2025: Legal disclaimer').t`By using ${LUMO_SHORT_APP_NAME}, you agree to our`}{' '}
                <InlineLinkButton
                    className="color-weak text-underline"
                    onClick={() => window.open('https://lumo.proton.me/legal/terms', '_blank')}
                >
                    {c('collider_2025: Legal link').t`Terms`}
                </InlineLinkButton>{' '}
                {c('collider_2025: Legal disclaimer').t`and`}{' '}
                <InlineLinkButton
                    className="color-weak text-underline"
                    onClick={() => window.open('https://lumo.proton.me/legal/privacy', '_blank')}
                >
                    {c('collider_2025: Legal link').t`Privacy Policy`}
                </InlineLinkButton>
                .
            </p>
        </div>
    );
};

export default TermsAndConditions;
