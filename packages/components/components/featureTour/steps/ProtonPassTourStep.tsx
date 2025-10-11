import { c } from 'ttag';

import { organizationThunk } from '@proton/account/organization';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import { PASS_ANDROID_URL, PASS_DOWNLOAD_URL, PASS_IOS_URL, PASS_WEB_APP_URL } from '@proton/pass/constants';
import { PLANS } from '@proton/payments';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { isIos, isMobile } from '@proton/shared/lib/helpers/browser';
import logoPass from '@proton/styles/assets/img/onboarding/feature_tour-logo-pass.svg';
import passAppBackground from '@proton/styles/assets/img/onboarding/feature_tour-pass-background.svg';

import type { FeatureTourStepProps } from '../interface';
import type { ShouldDisplayTourStep } from '../interface';
import FeatureTourStepCTA from './components/FeatureTourStepCTA';
import FeatureTourStepsContent from './components/FeatureTourStepsContent';

export const shouldDisplayProtonPassTourStep: ShouldDisplayTourStep = async (dispatch) => {
    const [organization] = await Promise.all([dispatch(organizationThunk())]);
    return {
        canDisplay: [PLANS.BUNDLE, PLANS.FAMILY, PLANS.DUO].includes(organization.PlanName),
        preloadUrls: [logoPass, passAppBackground],
    };
};

const ProtonPassTourStep = (props: FeatureTourStepProps) => {
    const ios = (
        <Href key="iosbutton" href={PASS_IOS_URL} target="_blank">
            iOS
        </Href>
    );
    const android = (
        <Href key="androidbutton" href={PASS_ANDROID_URL} target="_blank">
            Android
        </Href>
    );
    const browser = (
        <Href key="browserbutton" href={PASS_WEB_APP_URL} target="_blank">{c('Onboarding modal').t`browser`}</Href>
    );

    const GetBrowserExt = (
        <ButtonLike as={Href} href={PASS_DOWNLOAD_URL} target="_blank" color="norm" fullWidth>{c('Action')
            .t`Get the browser extension`}</ButtonLike>
    );

    const GetTheApp = (
        <ButtonLike
            as={Href}
            href={isIos() ? PASS_IOS_URL : PASS_ANDROID_URL}
            target="_blank"
            color="norm"
            fullWidth
        >{c('Action').t`Get the app`}</ButtonLike>
    );

    return (
        <FeatureTourStepsContent
            bullets={props.bullets}
            illustrationSize="full"
            title={<img src={logoPass} alt={PASS_APP_NAME} />}
            illustration={passAppBackground}
            mainCTA={isMobile() ? GetTheApp : GetBrowserExt}
            extraCTA={
                <FeatureTourStepCTA type="secondary" onClick={props.onNext}>
                    {c('Button').t`Maybe later`}
                </FeatureTourStepCTA>
            }
        >
            {/* translator: complete sentence: Proton Pass allows you to store passwords, notes, and other sensitive information with end-to-end encryption. Available on iOS, Android and in your browser. */}
            <p className="m-0">{c('Info')
                .jt`${PASS_APP_NAME} allows you to store passwords, notes, and other sensitive information with end-to-end encryption. Available on ${ios}, ${android} and in your ${browser}.`}</p>
        </FeatureTourStepsContent>
    );
};

export default ProtonPassTourStep;
