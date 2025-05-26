import { type ReactNode, useMemo } from 'react';

import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { Button } from '@proton/atoms';
import Time from '@proton/components/components/time/Time';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { CYCLE } from '@proton/payments';
import arrowDownSvg from '@proton/styles/assets/img/onboarding/b2b-trial-tile-arrow-down.svg';
import crossSvg from '@proton/styles/assets/img/onboarding/b2b-trial-tile-cross.svg';
import hourGlassSvg from '@proton/styles/assets/img/onboarding/b2b-trial-tile-hourglass.svg';
import clsx from '@proton/utils/clsx';

import OnboardingContent from './OnboardingContent';
import OnboardingStep from './OnboardingStep';
import type { OnboardingStepRenderCallback } from './interface';

interface Props extends OnboardingStepRenderCallback {}

const getTrialInfo = (
    subscriptionEnd: number | undefined,
    planTitle: string | undefined,
    cycle: number | undefined
) => {
    if (!subscriptionEnd || !planTitle || !cycle) {
        return [];
    }

    const renewDate = <Time format="MMM d">{subscriptionEnd}</Time>;
    const cancelDate = <Time>{subscriptionEnd}</Time>;

    const autoRenewMessage =
        cycle === CYCLE.MONTHLY
            ? // translator: full sentence is: In 14 days, your trial will become a yearly paid subscription that automatically renews every month on ${renewDate}.
              c('Onboarding Trial').jt`that automatically renews every month on ${renewDate}.`
            : // translator: full sentence is: In 14 days, your trial will become a yearly paid subscription that automatically renews every ${cycle} months on ${renewDate}.
              c('Onboarding Trial').jt`that automatically renews every ${cycle} months on ${renewDate}.`;

    return [
        {
            id: 'yearly-subscription',
            // translator: full sentence is: In 14 days, your trial will become a yearly paid subscription that automatically renews every month on ${renewDate}.
            title: c('Onboarding Trial').t`In 14 days, your trial will become a yearly paid subscription`,
            description: autoRenewMessage,
            img: hourGlassSvg,
        },
        {
            id: 'cancel-anytime',
            title: c('Onboarding Trial').jt`You won't be charged if you cancel before ${cancelDate}.`,
            description: c('Onboarding Trial').t`After that date, you'll have X days to cancel for a pro-rated refund.`,
            img: crossSvg,
        },
        {
            id: 'downgrade',
            // translator: full sentence is: If you cancel, you will lose access to ${planTitle} immediately and you will be downgraded to our free plan.
            title: c('Onboarding Trial').t`If you cancel, you will lose access to ${planTitle} immediately`,
            // translator: full sentence is: If you cancel, you will lose access to ${planTitle} immediately and you will be downgraded to our free plan.
            description: c('Onboarding Trial').t`and you will be downgraded to our free plan.`,
            img: arrowDownSvg,
        },
    ];
};

const TrialFeature = ({ title, description, imgSrc }: { title: ReactNode; description: ReactNode; imgSrc: string }) => {
    const { viewportWidth } = useActiveBreakpoint();
    const isSmallViewPort = viewportWidth['<=small'];
    return (
        <div className="flex flex-row flex-nowrap gap-4 items-center mb-1">
            <img
                className={clsx('w-custom', isSmallViewPort && 'self-start')}
                style={{ '--w-custom': isSmallViewPort ? '3rem' : '5rem' }}
                src={imgSrc}
                alt=""
            />
            <div className="flex-1">
                <span className="text-bold">{title}</span> <span>{description}</span>
            </div>
        </div>
    );
};

const OnboardingTrialStep = ({ onNext }: Props) => {
    const [subscription] = useSubscription();

    const trialEndsOn = subscription?.PeriodEnd;
    const planTitle = subscription?.Plans[0]?.Title;
    const cycle = subscription?.Cycle;

    const trialInfo = useMemo(() => getTrialInfo(trialEndsOn, planTitle, cycle), [trialEndsOn, planTitle, cycle]);

    if (!subscription?.IsTrial) {
        return null;
    }

    const trialEndsOnFormatted = <Time>{subscription.PeriodEnd}</Time>;

    return (
        <OnboardingStep>
            <OnboardingContent
                title={c('Onboarding Trial').t`Your 14-day trial started`}
                description={c('Onboarding Trial').jt`Explore all premium features until ${trialEndsOnFormatted}.`}
                className="mb-16"
            >
                <div className="flex flex-column gap-y-1 mt-12">
                    {trialInfo.map(({ id, title, description, img }) => (
                        <TrialFeature key={id} title={title} imgSrc={img} description={description} />
                    ))}
                </div>
            </OnboardingContent>
            <footer>
                <Button size="large" color="norm" fullWidth onClick={onNext}>
                    {c('Onboarding Trial').t`Continue`}
                </Button>
            </footer>
        </OnboardingStep>
    );
};

export default OnboardingTrialStep;
