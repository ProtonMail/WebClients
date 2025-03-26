import { Suspense, lazy, useEffect, useRef } from 'react';

import { c } from 'ttag';

import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import { Button } from '@proton/atoms/index';
import Spotlight from '@proton/components/components/spotlight/Spotlight';
import useSpotlightShow from '@proton/components/components/spotlight/useSpotlightShow';
import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import useSpotlightOnFeature from '@proton/components/hooks/useSpotlightOnFeature';
import { FeatureCode } from '@proton/features/interface';
import { SECOND, VPN_APP_NAME } from '@proton/shared/lib/constants';
import { SentryMailInitiatives } from '@proton/shared/lib/helpers/sentry';

import useVPNDrawerTelemetry from './useVPNDrawerTelemetry';

import './drawer-vpn-view-spotlight.scss';

const VPNAnimation = lazy(() => import(/* webpackChunkName: "VPNAnimation" */ './VPNAnimation'));

interface Props {
    children: React.ReactNode;
}

const VPNDrawerSpotlight = ({ children }: Props) => {
    const anchorRef = useRef<HTMLDivElement>(null);
    const { spotlightIsClicked, spotlightIsDisplayed, spotlightIsDismissed } = useVPNDrawerTelemetry();
    const {
        welcomeFlags: { isDone },
    } = useWelcomeFlags();
    const { show, onDisplayed, onClose } = useSpotlightOnFeature(FeatureCode.SpotlightVPNDrawer, isDone);
    const shouldShowSpotlight = useSpotlightShow(show, 3 * SECOND);

    const handleClick = () => {
        spotlightIsClicked();
        onClose();
    };

    const handleClose = () => {
        spotlightIsDismissed();
        onClose();
    };

    useEffect(() => {
        if (shouldShowSpotlight) {
            spotlightIsDisplayed();
        }
    }, [shouldShowSpotlight]);

    return (
        <Spotlight
            originalPlacement="left"
            show={shouldShowSpotlight}
            onDisplayed={onDisplayed}
            onClose={handleClose}
            anchorRef={anchorRef}
            className="drawer-vpn-view-spotlight"
            innerClassName="drawer-vpn-view-spotlight-inner overflow-hidden"
            content={
                <div className="flex flex-nowrap flex-column">
                    <ErrorBoundary component={null} initiative={SentryMailInitiatives.DRAWER_VPN}>
                        <div className="shrink-0">
                            <Suspense fallback={<div className="drawer-vpn-view-spotlight-gradient-placeholder"></div>}>
                                <VPNAnimation />
                            </Suspense>
                        </div>
                    </ErrorBoundary>
                    <div className="flex flex-column flex-nowrap gap-2 m-4">
                        <h1 className="text-lg text-bold m-0">{c('Title')
                            .t`Increase security with ${VPN_APP_NAME}`}</h1>
                        <p className="mt-0 mb-2 color-weak">{c('Info')
                            .t`Browse privately and access blocked content.`}</p>
                        <Button fullWidth shape="solid" color="norm" onClick={handleClick}>{c('Action')
                            .t`Explore ${VPN_APP_NAME}`}</Button>
                    </div>
                </div>
            }
        >
            <div ref={anchorRef}>{children}</div>
        </Spotlight>
    );
};

export default VPNDrawerSpotlight;
