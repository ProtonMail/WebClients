import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { type ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Time from '@proton/components/components/time/Time';
import TimeRemaining from '@proton/components/components/timeRemaining/TimeRemaining';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import useConfig from '@proton/components/hooks/useConfig';
import chronometerSvg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-chronometer.svg';
import hourglassSvg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-hourglass.svg';
import clsx from '@proton/utils/clsx';

import { useCancelSubscriptionFlow } from '../payments/subscription/cancelSubscription/useCancelSubscriptionFlow';

const getTrialInfo = (planTitle: string | undefined) => {
    if (!planTitle) {
        return [];
    }

    const cancelAnytimeTitle = <b>{c('Onboarding Trial').t`Cancel anytime before then.`}</b>;
    const cancelAnytimeDescription = c('Onboarding Trial')
        .jt`You’ll be able to use ${planTitle} until the trial ends, free of charge.`;
    const cancelAnytimeArray = [cancelAnytimeTitle, ' ', cancelAnytimeDescription];

    // translator: full sentence is: Once your full subscription starts... You can still cancel within 30 days and get a pro-rata refund.
    const refundTitle = <b>{c('Onboarding Trial').jt`Once your full subscription starts...`}</b>;

    // translator: full sentence is: Once your full subscription starts... You can still cancel within 30 days and get a prorated refund.
    const refundDescription = c('Onboarding Trial').t`You can still cancel within 30 days and get a prorated refund.`;
    const refundArray = [refundTitle, ' ', refundDescription];

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

const LearnMoreModal = (props: ModalStateProps) => {
    const { onClose, onExit, open } = props;
    const { APP_NAME } = useConfig();
    const { cancelSubscription, cancelSubscriptionModals } = useCancelSubscriptionFlow({ app: APP_NAME });
    const [subscription] = useSubscription();
    const [organization] = useOrganization();
    const [user] = useUser();
    const [showModal, setShowModal] = useState(open);
    useEffect(() => {
        setShowModal(true);
    }, [open]);

    const trialEndsOn = subscription?.PeriodEnd;
    const planTitle = subscription?.Plans?.[0]?.Title;

    const trialInfo = useMemo(() => getTrialInfo(planTitle), [planTitle]);

    if (!subscription || !organization || !user || !trialEndsOn) {
        return null;
    }

    const timeRemaining = <TimeRemaining expiry={trialEndsOn} />;

    // translator: full sentence is: "Your free trial ends in 14 days" or "Your free trial ends in 14 hours" or "Your free trial ends in 14 minutes"
    // translator: the most common case is "days"
    const title = c('b2b_trials_Title').jt`Your free trial ends in ${timeRemaining}`;

    const boldEndDate = (
        <span className="text-bold">
            <Time>{trialEndsOn}</Time>
        </span>
    );

    return (
        <>
            {cancelSubscriptionModals}
            <ModalTwo {...props} rootClassName={clsx(!showModal && 'modal-two--out')}>
                <ModalTwoHeader title={title} />
                <ModalTwoContent>
                    <p>{c('Onboarding Trial').jt`Your full ${planTitle} subscription starts on ${boldEndDate}.`}</p>
                    <div className="flex flex-column gap-y-4 mt-12">
                        {trialInfo.map(({ id, description, img }) => (
                            <TrialFeature key={id} description={description} imgSrc={img} />
                        ))}
                    </div>
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button
                        onClick={async () => {
                            setShowModal(false);
                            try {
                                await cancelSubscription({});
                            } finally {
                                // Once `cancelSubscription` shows a modal instead of a notification,
                                // we can call onClose instead of onExit to display a closing animation
                                onExit();
                            }
                        }}
                    >{c('Action').t`Cancel subscription`}</Button>
                    <Button color="norm" onClick={onClose}>{c('Action').t`Got it`}</Button>
                </ModalTwoFooter>
            </ModalTwo>
        </>
    );
};

export default LearnMoreModal;
