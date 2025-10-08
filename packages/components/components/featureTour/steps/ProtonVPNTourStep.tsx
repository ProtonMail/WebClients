import { c } from 'ttag';

import { organizationThunk } from '@proton/account/organization';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import { PLANS } from '@proton/payments';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import { isIos, isLinux, isMac, isMobile } from '@proton/shared/lib/helpers/browser';
import {
    VPN_ANDROID_URL,
    VPN_APPLE_TV_URL,
    VPN_DESKTOP_LINUX_URL,
    VPN_DESKTOP_MAC_URL,
    VPN_DESKTOP_WINDOWS_URL,
    VPN_IOS_URL,
} from '@proton/shared/lib/vpn/constants';
import logoVpn from '@proton/styles/assets/img/onboarding/feature_tour-logo-vpn.svg';
import vpnAppBackground from '@proton/styles/assets/img/onboarding/feature_tour-vpn-background.svg';

import type { FeatureTourStepProps, ShouldDisplayTourStep } from '../interface';
import FeatureTourStepCTA from './components/FeatureTourStepCTA';
import FeatureTourStepsContent from './components/FeatureTourStepsContent';

// eslint-disable-next-line no-nested-ternary
const VPN_DESKTOP_URL = isMac() ? VPN_DESKTOP_MAC_URL : isLinux() ? VPN_DESKTOP_LINUX_URL : VPN_DESKTOP_WINDOWS_URL;

export const shouldDisplayProtonVPNTourStep: ShouldDisplayTourStep = async (dispatch) => {
    const [organization] = await Promise.all([dispatch(organizationThunk())]);
    return {
        canDisplay: [PLANS.BUNDLE, PLANS.FAMILY, PLANS.DUO].includes(organization.PlanName),
        preloadUrls: [logoVpn, vpnAppBackground],
    };
};

const ProtonVPNTourStep = (props: FeatureTourStepProps) => {
    const ios = (
        <Href key="iosbutton" href={VPN_IOS_URL} target="_blank">
            iOS
        </Href>
    );
    const android = (
        <Href key="androidbutton" href={VPN_ANDROID_URL} target="_blank">
            Android
        </Href>
    );
    const desktop = (
        <Href key="desktopbutton" href={VPN_DESKTOP_URL} target="_blank">{c('Onboarding modal').t`Desktop`}</Href>
    );

    const appleTV = (
        <Href key="appleTVbutton" href={VPN_APPLE_TV_URL} target="_blank">
            Apple TV
        </Href>
    );

    const DesktopAppLink = (
        <ButtonLike as={Href} color="norm" fullWidth href={VPN_DESKTOP_URL}>{c('Action')
            .t`Download the desktop app`}</ButtonLike>
    );

    const MobileAppLink = (
        <ButtonLike as={Href} color="norm" fullWidth href={isIos() ? VPN_IOS_URL : VPN_ANDROID_URL}>{c('Action')
            .t`Get the app`}</ButtonLike>
    );

    return (
        <FeatureTourStepsContent
            bullets={props.bullets}
            illustrationSize="full"
            title={<img src={logoVpn} alt={VPN_APP_NAME} />}
            illustration={vpnAppBackground}
            mainCTA={isMobile() ? MobileAppLink : DesktopAppLink}
            extraCTA={
                <FeatureTourStepCTA type="secondary" onClick={props.onNext}>
                    {c('Button').t`Maybe later`}
                </FeatureTourStepCTA>
            }
        >
            {/* translator: complete sentence: Access 6,500+ high-speed servers on up to 10 devices to keep your browsing data safe. Available on iOS, Android, Apple TV and Desktop. */}
            <p className="m-0">{c('Info')
                .jt`Access 6,500+ high-speed servers on up to 10 devices to keep your browsing data safe. Available on ${ios}, ${android}, ${appleTV}, and ${desktop}.`}</p>
        </FeatureTourStepsContent>
    );
};

export default ProtonVPNTourStep;
