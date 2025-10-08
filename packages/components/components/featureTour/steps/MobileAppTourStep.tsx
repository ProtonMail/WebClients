import { c } from 'ttag';

import { userSettingsThunk } from '@proton/account';
import { Href } from '@proton/atoms/Href/Href';
import { appendUrlSearchParams } from '@proton/shared/lib/helpers/url';
import { isMailMobileAppUser } from '@proton/shared/lib/helpers/usedClientsFlags';
import { MAIL_MOBILE_APP_LINKS } from '@proton/shared/lib/mail/constants';
import downloadOniOS from '@proton/styles/assets/img/onboarding/feature_tour-app_store.svg';
import downloadOnGooglePlay from '@proton/styles/assets/img/onboarding/feature_tour-google_play.svg';
import mobileAppBackground from '@proton/styles/assets/img/onboarding/feature_tour-mobile-app-background.svg';

import type { FeatureTourStepProps } from '../interface';
import type { ShouldDisplayTourStep } from '../interface';
import FeatureTourStepCTA from './components/FeatureTourStepCTA';
import FeatureTourStepsContent from './components/FeatureTourStepsContent';

export const shouldDisplayMobileAppTourStep: ShouldDisplayTourStep = async (dispatch) => {
    const [userSettings] = await Promise.all([dispatch(userSettingsThunk())]);
    const hasUsedMobileApp = isMailMobileAppUser(BigInt(userSettings.UsedClientFlags));
    return {
        canDisplay: !hasUsedMobileApp,
        preloadUrls: [mobileAppBackground, downloadOniOS, downloadOnGooglePlay],
    };
};

const MobileAppTourStep = (props: FeatureTourStepProps) => {
    const appStoreLink = appendUrlSearchParams(MAIL_MOBILE_APP_LINKS.appStore, {
        pt: '106513916',
        ct: 'webapp-mail-feature-tour',
        mt: '8',
    });
    const androidLink = appendUrlSearchParams(MAIL_MOBILE_APP_LINKS.playStore, {
        utm_source: 'webapp',
        utm_campaign: 'webapp-mail-feature-tour',
    });

    const iosAppLink = (
        <Href key="appstore" href={appStoreLink} target="_blank">
            iOS
        </Href>
    );
    const androidAppLink = (
        <Href key="googleplay" href={androidLink} target="_blank">
            Android
        </Href>
    );

    return (
        <FeatureTourStepsContent
            bullets={props.bullets}
            illustrationSize="full"
            title={c('Title').t`Anytime, anywhere access`}
            illustration={mobileAppBackground}
            mainCTA={
                <FeatureTourStepCTA type="secondary" onClick={props.onNext}>
                    {c('Button').t`Maybe later`}
                </FeatureTourStepCTA>
            }
        >
            <p className="mt-0 mb-4">
                {c('Info')
                    .jt`For anytime access to email and an optimized mobile experience, download our ${androidAppLink} or ${iosAppLink}.`}
            </p>
            <div className="flex flex-nowrap justify-center gap-4 mb-8">
                <Href href={androidLink} target="_blank">
                    <img src={downloadOnGooglePlay} alt={c('Info').t`Get it on Google Play`} width="135" height="40" />
                </Href>
                <Href href={appStoreLink} target="_blank">
                    <img src={downloadOniOS} alt={c('Info').t`Download on the App Store`} width="135" height="40" />
                </Href>
            </div>
        </FeatureTourStepsContent>
    );
};

export default MobileAppTourStep;
