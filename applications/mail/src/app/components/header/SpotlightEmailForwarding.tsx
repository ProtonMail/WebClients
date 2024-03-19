import { ReactNode, useRef } from 'react';

import { c } from 'ttag';

import { SettingsLink, Spotlight, useSpotlightShow } from '@proton/components/components';
import { useActiveBreakpoint, useSpotlightOnFeature, useUser, useWelcomeFlags } from '@proton/components/hooks';
import { FeatureCode } from '@proton/features';
import { APPS } from '@proton/shared/lib/constants';
import { hasPaidMail } from '@proton/shared/lib/user/helpers';

interface Props {
    children: ReactNode;
}

/**
 * Spotlight to introduce email forwarding to existing users
 * @see MAILWEB-4476
 */
const SpotlightEmailForwarding = ({ children }: Props) => {
    const ref = useRef<HTMLDivElement>(null);
    const [user] = useUser();
    const isPayingForMail = hasPaidMail(user);
    const [{ isWelcomeFlow }] = useWelcomeFlags();
    const { viewportWidth } = useActiveBreakpoint();
    const releaseUTCDate = Date.UTC(2023, 10, 1, 12); // 1st November 2023 at 12:00 UTC
    const {
        show: showSpotlight,
        onDisplayed,
        onClose,
    } = useSpotlightOnFeature(
        FeatureCode.EmailForwardingSpotlight,
        !isWelcomeFlow && !viewportWidth['<=small'] && isPayingForMail,
        {
            alpha: 0,
            beta: releaseUTCDate,
            default: releaseUTCDate,
        }
    );
    const show = useSpotlightShow(showSpotlight);
    // Wrap the children in a div to avoid conflicts with tooltip
    return (
        <Spotlight
            originalPlacement="bottom"
            show={show}
            onDisplayed={onDisplayed}
            onClose={onClose}
            anchorRef={ref}
            type="new"
            style={{ maxWidth: '25rem' }}
            content={
                <>
                    <p className="m-0">{c('Spotlight').t`You can now automatically forward your emails to anyone!`}</p>
                    <SettingsLink path="/auto-reply" app={APPS.PROTONMAIL}>{c('Link')
                        .t`Set up email forwarding`}</SettingsLink>
                </>
            }
        >
            <div ref={ref}>{children}</div>
        </Spotlight>
    );
};

export default SpotlightEmailForwarding;
