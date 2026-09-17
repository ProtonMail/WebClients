import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useGetPaymentMethods } from '@proton/account/paymentMethods/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import { Button } from '@proton/atoms/Button/Button';
import { getPlanTitle } from '@proton/payments/core/subscription/helpers';
import chronometerSvg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-chronometer.svg';
import hourglassSvg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-hourglass.svg';
import paymentMethodSvg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-payment-method.svg';
import clsx from '@proton/utils/clsx';

import ModalTwo from '../../components/modalTwo/Modal';
import ModalTwoContent from '../../components/modalTwo/ModalContent';
import ModalTwoFooter from '../../components/modalTwo/ModalFooter';
import ModalTwoHeader from '../../components/modalTwo/ModalHeader';
import type { ModalStateProps } from '../../components/modalTwo/useModalState';
import Time from '../../components/time/Time';
import TimeRemaining from '../../components/timeRemaining/TimeRemaining';
import getBoldFormattedText from '../../helpers/getBoldFormattedText';
import useActiveBreakpoint from '../../hooks/useActiveBreakpoint';
import { useCancelSubscriptionFlow } from '../payments/subscription/cancelSubscription/useCancelSubscriptionFlow';

interface TrialElement {
    id: string;
    description: ReactNode;
    img: string;
}

const getTrialInfo = (planTitle: string | undefined, hasPaymentMethod: boolean): TrialElement[] => {
    if (!planTitle) {
        return [];
    }

    // translator: text between ** ** is displayed in bold
    const cancelAnytime = getBoldFormattedText(
        c('Onboarding Trial')
            .t`**Cancel anytime before then.** You’ll be able to use ${planTitle} until the trial ends, free of charge.`
    );

    // translator: text between ** ** is displayed in bold
    const addPaymentMethod = getBoldFormattedText(
        c('Onboarding Trial').t`**Add a payment method** to keep using all of the features after your trial ends.`
    );

    // translator: text between ** ** is displayed in bold
    const refund = getBoldFormattedText(
        c('Onboarding Trial')
            .t`**Once your full subscription starts...** You can still cancel within 30 days and get a prorated refund.`
    );

    // translator: text between ** ** is displayed in bold
    const continueAfterTrial = getBoldFormattedText(
        c('Onboarding Trial')
            .t`**If you continue after your trial,** you can cancel within 30 days and get a pro-rata refund.`
    );

    return [
        hasPaymentMethod
            ? {
                  id: 'cancelAnytime',
                  description: cancelAnytime,
                  img: hourglassSvg,
              }
            : {
                  id: 'addPaymentMethod',
                  description: addPaymentMethod,
                  img: paymentMethodSvg,
              },
        {
            id: 'refund',
            description: hasPaymentMethod ? refund : continueAfterTrial,
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
    const getPaymentMethods = useGetPaymentMethods();
    const [hasPaymentMethod, setHasPaymentMethod] = useState<boolean>();
    const [showModal, setShowModal] = useState(open);
    useEffect(() => {
        setShowModal(true);
    }, [open]);

    const trialEndsOn = subscription?.PeriodEnd;
    const planTitle = getPlanTitle(subscription);
    const loading = !subscription || !organization || !user || !trialEndsOn;
    const loadingPaymentMethods = hasPaymentMethod === undefined;

    useEffect(() => {
        if (loading) {
            return;
        }

        void getPaymentMethods()
            .then((paymentMethods) => setHasPaymentMethod(paymentMethods.length > 0))
            // Close the modal so its state is reset and a retry is possible
            .catch(() => onClose());
    }, [loading, getPaymentMethods, onClose]);

    const trialInfo = getTrialInfo(planTitle, !!hasPaymentMethod);

    if (loading || loadingPaymentMethods || trialEndsOn === undefined) {
        return null;
    }

    const timeRemaining = <TimeRemaining expiry={trialEndsOn} key="time-remaining" />;

    // translator: full sentence is: "Your free trial ends in 14 days" or "Your free trial ends in 14 hours" or "Your free trial ends in 14 minutes"
    // translator: the most common case is "days"
    const title = c('b2b_trials_Title').jt`Your free trial ends in ${timeRemaining}`;

    const boldEndDate = (
        <span className="text-bold" key="end-date">
            <Time>{trialEndsOn}</Time>
        </span>
    );

    return (
        <>
            {cancelSubscriptionModals}
            <ModalTwo {...props} rootClassName={clsx(!showModal && 'modal-two--out')}>
                <ModalTwoHeader title={title} />
                <ModalTwoContent>
                    {hasPaymentMethod && (
                        <p>{c('Onboarding Trial').jt`Your full ${planTitle} subscription starts on ${boldEndDate}.`}</p>
                    )}
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
