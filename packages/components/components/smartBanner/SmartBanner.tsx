import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import Logo from '../logo/Logo';
import { useSmartBanner } from './useSmartBanner';
import { useSmartBannerTelemetry } from './useSmartBannerTelemetry';

interface SmartBannerProps {
    app: APP_NAMES;
    subtitle?: string;
    title?: string;
}

const SmartBanner = ({
    app,
    subtitle = c('SmartBanner').t`Private, fast, and organized`,
    title = c('SmartBanner').t`Faster on the app`,
}: SmartBannerProps) => {
    const bannerHref = useSmartBanner(app);
    const handleLinkClick = useSmartBannerTelemetry(app);

    if (!bannerHref) {
        return null;
    }

    return (
        // Disabling this eslint rule because the recommendation to use section or fragment
        // is not appropriate. We want this to be a landmark to reduce the chances of being
        // missed by screen readers.
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        <div
            role="region"
            aria-label={c('Label').t`Notification`}
            className="flex flex-nowrap flex-row p-4 items-center border-bottom border-weak"
        >
            <div className="shrink-0 border border-weak rounded-xl p-1">
                <Logo appName={app} size={8} variant="glyph-only" />
            </div>
            <p className="m-0 flex-1 pl-3 pr-2">
                <span className="block">{title}</span>
                <span className="block color-weak text-sm">{subtitle}</span>
            </p>
            <ButtonLike
                as="a"
                color="weak"
                href={bannerHref}
                onClick={handleLinkClick}
                pill={true}
                shape="solid"
                size="medium"
            >
                {c('Action').t`Download`}
            </ButtonLike>
        </div>
    );
};

export default SmartBanner;
