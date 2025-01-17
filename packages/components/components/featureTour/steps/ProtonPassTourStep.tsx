import { c } from 'ttag';

import { organizationThunk } from '@proton/account/organization';
import { ButtonLike, Href } from '@proton/atoms';
import { PASS_ANDROID_URL, PASS_DOWNLOAD_URL, PASS_IOS_URL, PASS_WEB_APP_URL } from '@proton/pass/constants';
import { PLANS } from '@proton/payments';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import logoPass from '@proton/styles/assets/img/onboarding/feature_tour-logo-pass.svg';
import passAppBackground from '@proton/styles/assets/img/onboarding/feature_tour-pass-background.svg';

import type { FeatureTourStepProps } from '../interface';
import type { ShouldDisplayTourStep } from '../interface';
import FeatureTourStepsContent from './components/FeatureTourStepsContent';

export const shouldDisplayProtonPassTourStep: ShouldDisplayTourStep = async (dispatch) => {
    const [organization] = await Promise.all([dispatch(organizationThunk())]);
    return [PLANS.BUNDLE, PLANS.FAMILY, PLANS.DUO].includes(organization.PlanName);
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

    const browserExt = (
        <ButtonLike as={Href} className="mb-2" href={PASS_DOWNLOAD_URL} target="_blank" color="norm" fullWidth>{c(
            'Action'
        ).t`Get the browser extension`}</ButtonLike>
    );

    const description = c('Info')
        .jt`${PASS_APP_NAME} allows you to store passwords, notes, and other sensitive information with end-to-end encryption. Available on ${ios}, ${android} and in your ${browser}.`;

    return (
        <FeatureTourStepsContent
            illustrationSize="full"
            title={<img src={logoPass} alt={PASS_APP_NAME} />}
            description={description}
            illustration={passAppBackground}
            titleClassName="pt-3"
            descriptionClassName="mb-8"
            primaryButton={isMobile() ? undefined : browserExt}
            {...props}
        />
    );
};

export default ProtonPassTourStep;
