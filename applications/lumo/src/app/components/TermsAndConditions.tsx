import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { getMarketingUrl } from '../util/marketingUrls';

const TermsAndConditions = ({ className }: { className?: string }) => {
    const showNewMarketingLinks = useFlag('LumoNewMarketingLinks');
    const termsUrl = showNewMarketingLinks ? getMarketingUrl('/lumo/terms') : 'https://lumo.proton.me/legal/terms';
    const privacyUrl = showNewMarketingLinks
        ? getMarketingUrl('/lumo/privacy-policy')
        : 'https://lumo.proton.me/legal/privacy';

    return (
        <p className={clsx('text-sm color-weak', className)}>
            {c('collider_2025: Legal disclaimer').t`By using ${LUMO_SHORT_APP_NAME}, you agree to our`}{' '}
            <Href href={termsUrl} className="color-weak text-underline">
                {c('collider_2025: Legal link').t`Terms`}
            </Href>{' '}
            {c('collider_2025: Legal disclaimer').t`and`}{' '}
            <Href href={privacyUrl} className="color-weak text-underline">
                {c('collider_2025: Legal link').t`Privacy Policy`}
            </Href>
            .
        </p>
    );
};

export default TermsAndConditions;
