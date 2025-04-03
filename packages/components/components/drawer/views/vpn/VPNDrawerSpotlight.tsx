import { Suspense, lazy, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import { Button } from '@proton/atoms/index';
import Logo from '@proton/components/components/logo/Logo';
import Spotlight from '@proton/components/components/spotlight/Spotlight';
import useSpotlightShow from '@proton/components/components/spotlight/useSpotlightShow';
import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import useDrawer from '@proton/components/hooks/drawer/useDrawer';
import useApi from '@proton/components/hooks/useApi';
import useSpotlightOnFeature from '@proton/components/hooks/useSpotlightOnFeature';
import { FeatureCode } from '@proton/features/interface';
import { PLANS } from '@proton/payments/index';
import {
    type ConnectionInformationResult,
    getConnectionInformation,
} from '@proton/shared/lib/api/core/connection-information';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { SECOND, VPN_APP_NAME } from '@proton/shared/lib/constants';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import { SentryMailInitiatives } from '@proton/shared/lib/helpers/sentry';
import { getPlan } from '@proton/shared/lib/helpers/subscription';

import useVPNDrawerTelemetry from './useVPNDrawerTelemetry';

import './drawer-vpn-view-spotlight.scss';

const VPNAnimation = lazy(() => import(/* webpackChunkName: "VPNAnimation" */ './VPNAnimation'));

interface Props {
    children: React.ReactNode;
}

const VPNDrawerSpotlight = ({ children }: Props) => {
    const api = useApi();
    const silentApi = getSilentApi(api);
    const [user] = useUser();
    const [showSpotlight, setShowSpotlight] = useState(false);
    const [subscription] = useSubscription();
    const { toggleDrawerApp } = useDrawer();
    const { Name: planName } = getPlan(subscription) || {};
    // Has Plus Mail, Drive, or Pass, exclude VPN Plus
    const hasPlusPlan = planName === PLANS.MAIL || planName === PLANS.DRIVE || planName === PLANS.PASS;
    const showIncludedFeatures = user.isFree || hasPlusPlan;
    const anchorRef = useRef<HTMLDivElement>(null);
    const { spotlightIsClicked, spotlightIsDisplayed, spotlightIsDismissed } = useVPNDrawerTelemetry();
    const {
        welcomeFlags: { isDone },
    } = useWelcomeFlags();
    const { show, onDisplayed, onClose } = useSpotlightOnFeature(FeatureCode.SpotlightVPNDrawer, isDone);
    const shouldShowSpotlight = useSpotlightShow(show, 3 * SECOND);

    const handleClick = () => {
        spotlightIsClicked();
        toggleDrawerApp({ app: DRAWER_NATIVE_APPS.VPN })();
        onClose();
    };

    const handleClose = () => {
        spotlightIsDismissed();
        onClose();
    };

    useEffect(() => {
        if (shouldShowSpotlight) {
            const run = async () => {
                const result = await silentApi<ConnectionInformationResult>(getConnectionInformation());
                // Only show the spotlight if Proton VPN is not connected
                setShowSpotlight(!result.IsVpnConnection);
            };

            void run();
        }
    }, [shouldShowSpotlight]);

    return (
        <Spotlight
            originalPlacement="left"
            show={showSpotlight}
            onDisplayed={() => {
                spotlightIsDisplayed();
                onDisplayed();
            }}
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
                        {showIncludedFeatures && (
                            <span className="inline-flex flex-nowrap flex-row bg-weak rounded items-center p-1 mr-auto text-semibold color-weak">
                                <span className="bg-norm rounded logo-vpn flex mr-2 ml-0.5">
                                    <Logo appName="proton-vpn-settings" variant="glyph-only" className="m-auto" />
                                </span>
                                <span className="text-sm mr-1">{c('Info').t`Included for free with your plan`}</span>
                            </span>
                        )}

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
