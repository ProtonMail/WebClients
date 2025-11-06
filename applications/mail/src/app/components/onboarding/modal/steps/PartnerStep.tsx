import { c } from 'ttag';

import { useCustomDomains } from '@proton/account/domains/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { OnboardingStep, type OnboardingStepRenderCallback } from '@proton/components';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import checkConfirmation from '@proton/styles/assets/img/onboarding/img-check-confirmation.svg';

import type { OnboardingStepEligibleCallback } from '../interface';
import OnboardingContent from '../layout/OnboardingContent';

export const isPartnerStepEligible: OnboardingStepEligibleCallback = async () => ({
    canDisplay: new URLSearchParams(window.location.search).get('partner') === 'true',
    preload: [checkConfirmation],
});

const PartnerStep = ({ onNext }: OnboardingStepRenderCallback) => {
    const [subscription] = useSubscription();
    const [domains] = useCustomDomains();
    const domain = domains ? domains[0]?.DomainName : undefined;
    const plan = subscription ? subscription.Plans : undefined;
    const subscriptionName = plan ? plan[0].Title : undefined;

    const description =
        domain === undefined || subscriptionName === undefined
            ? c('Onboarding modal').t`Your domain and subscription are ready to use.`
            : c('Onboarding modal').t`Your domain ${domain} and ${subscriptionName} subscription are ready to use.`;

    return (
        <OnboardingStep>
            <OnboardingContent
                topChildren={<img src={checkConfirmation} alt="" />}
                title={c('Onboarding modal').t`You are all set!`}
                description={description}
                className="mb-16 h-custom flex flex-column items-center justify-center"
                style={{ '--h-custom': '25.625rem' }}
            ></OnboardingContent>
            <footer>
                <Button size="large" color="norm" fullWidth onClick={onNext}>
                    {c('Onboarding modal').t`Discover ${MAIL_APP_NAME}`}
                </Button>
            </footer>
        </OnboardingStep>
    );
};

export default PartnerStep;
