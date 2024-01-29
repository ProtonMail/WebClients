import { useRef } from 'react';

import { addDays, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { Spotlight, useSpotlightShow } from '@proton/components/components';
import { useActiveBreakpoint, useSpotlightOnFeature, useUser, useWelcomeFlags } from '@proton/components/hooks';
import { FeatureCode } from '@proton/features';
import spotlightImg from '@proton/styles/assets/img/illustrations/spotlight-security-center.svg';

interface Props {
    children: React.ReactNode;
}

const SecurityCenterSpotlight = ({ children }: Props) => {
    const anchorRef = useRef<HTMLDivElement>(null);
    const [user] = useUser();
    const { viewportWidth } = useActiveBreakpoint();
    const [{ isDone }] = useWelcomeFlags();
    const userAccountHasMoreThanTwoDays = new Date() > addDays(fromUnixTime(user.CreateTime), 2);

    /**
     * Display conditions:
     * 1. User is not on a mobile screen
     * 2. User has done the welcome flow
     * 3. User has created his account more than 2 days ago
     */
    const displaySpotlight = !viewportWidth['<=small'] && isDone && userAccountHasMoreThanTwoDays;

    const { show, onDisplayed, onClose } = useSpotlightOnFeature(FeatureCode.SpotlightSecurityCenter, displaySpotlight);

    const shouldShowSpotlight = useSpotlightShow(show);

    return (
        <Spotlight
            originalPlacement="left"
            show={shouldShowSpotlight}
            onDisplayed={onDisplayed}
            anchorRef={anchorRef}
            size="large"
            content={
                <div className="flex flex-nowrap my-2">
                    <div className="shrink-0 mr-4">
                        <img src={spotlightImg} alt="" />
                    </div>
                    <div>
                        <p className="m-0">{c('Spotlight')
                            .t`Create hide-my-email aliases and keep track of them here.`}</p>
                    </div>
                </div>
            }
        >
            <div ref={anchorRef} onClick={onClose}>
                {children}
            </div>
        </Spotlight>
    );
};

export default SecurityCenterSpotlight;
