import { type ReactNode, useMemo } from 'react';

import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { Button, Href } from '@proton/atoms';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import Time from '@proton/components/components/time/Time';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { useIsB2BTrial } from '@proton/payments/ui';
import chronometerSvg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-chronometer.svg';
import helpSvg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-help.svg';
import hourglassSvg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-hourglass.svg';
import clsx from '@proton/utils/clsx';

interface Props {
    onNext: () => void;
}

const getTrialInfo = (subscriptionEnd?: number, planTitle?: string) => {
    if (!subscriptionEnd || !planTitle) {
        return [];
    }

    const cancelDate = <Time key="eslint-autofix-560DB6">{subscriptionEnd}</Time>;

    const cancelAnytimeTitle = <b>{c('Onboarding Trial').jt`Cancel anytime before ${cancelDate}.`}</b>;
    const cancelAnytimeDescription = c('Onboarding Trial')
        .jt`You can use ${planTitle} until the trial ends, and you won’t be charged.`;
    const cancelAnytimeArray = [cancelAnytimeTitle, ' ', cancelAnytimeDescription];

    // translator: full sentence is: Once your full subscription starts... You can still cancel within 30 days and get a pro-rata refund.
    const refundTitle = <b>{c('Onboarding Trial').jt`Once your full subscription starts...`}</b>;

    // translator: full sentence is: Once your full subscription starts... You can still cancel within 30 days and get a pro-rata refund.
    const refundDescription = c('Onboarding Trial').t`You can still cancel within 30 days and get a pro-rata refund.`;
    const refundArray = [refundTitle, ' ', refundDescription];

    // translator: full sentence is: If you need help, visit our help center or contact our support team.
    const helpCenterLink = (
        <Href href="https://proton.me/support/business" key="eslint-autofix-EF1560">{c('Onboarding Trial')
            .t`help center`}</Href>
    );

    // translator: full sentence is: If you need help, visit our help center or contact our support team.
    const contactSupportLink = (
        <Href href="https://proton.me/support/business" key="eslint-autofix-EEF3DD">{c('Onboarding Trial')
            .t`contact our support team`}</Href>
    );

    // translator: full sentence is: If you need help, visit our help center or contact our support team.
    const helpTitle = <b>{c('Onboarding Trial').t`If you need help,`}</b>;
    // translator: full sentence is: If you need help, visit our help center or contact our support team.
    const helpDescription = c('Onboarding Trial').jt` visit our ${helpCenterLink} or ${contactSupportLink}.`;
    const helpArray = [helpTitle, ' ', helpDescription];

    return [
        {
            id: 'cancelAnytime',
            description: cancelAnytimeArray,
            img: hourglassSvg,
        },
        {
            id: 'refund',
            description: refundArray,
            img: chronometerSvg,
        },
        {
            id: 'help',
            description: helpArray,
            img: helpSvg,
        },
    ];
};

const TrialFeature = ({ description, imgSrc }: { description: ReactNode; imgSrc: string }) => {
    const { viewportWidth } = useActiveBreakpoint();
    const isSmallViewPort = viewportWidth['<=small'];
    return (
        <div className="flex flex-row gap-4 items-center">
            <img
                className={clsx('w-custom', isSmallViewPort && 'self-start')}
                style={{ '--w-custom': isSmallViewPort ? '3rem' : '5rem' }}
                src={imgSrc}
                alt=""
            />
            <div className="flex-1 flex gap-0">
                <p className="m-0 text-weak">{description}</p>
            </div>
        </div>
    );
};

const OnboardingTrialStep = ({ onNext }: Props) => {
    const [subscription] = useSubscription();
    const [organization] = useOrganization();

    const isB2BTrial = useIsB2BTrial(subscription, organization);

    const trialEndsOn = subscription?.PeriodEnd;
    const planTitle = subscription?.Plans?.[0]?.Title;

    const trialInfo = useMemo(() => getTrialInfo(trialEndsOn, planTitle), [trialEndsOn, planTitle]);

    if (!isB2BTrial) {
        return null;
    }

    const trialEndsOnFormatted = <Time key="eslint-autofix-FC02AC">{trialEndsOn}</Time>;

    return (
        <>
            <ModalTwoHeader
                title={c('Onboarding Trial').t`Your free trial has started`}
                titleClassName="mb-2 text-2xl text-bold text-center"
                subline={
                    <>{c('Onboarding Trial')
                        .jt`Enjoy free business security features until ${trialEndsOnFormatted}.`}</>
                }
                sublineClassName="text-center color-weak mb-6"
                hasClose={false}
            />
            <ModalTwoContent className="mb-4">
                <div className="flex flex-column gap-y-4 mt-12">
                    {trialInfo.map(({ id, description, img }) => (
                        <TrialFeature key={id} imgSrc={img} description={description} />
                    ))}
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button size="large" color="norm" fullWidth onClick={onNext}>
                    {c('Onboarding Trial').t`Continue`}
                </Button>
            </ModalTwoFooter>
        </>
    );
};

export default OnboardingTrialStep;
