import { useState } from 'react';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import { PLANS, getPlanName } from '@proton/payments';
import type { FeedbackDowngradeData } from '@proton/payments/core/api/api';

import { useCancelRenewal } from '../cancelSubscription/useCancelRenewal';
import type { FeedbackDowngradeResult } from '../content/FeedbackDowngradeContent';
import FeedbackDowngradeContent, {
    SUBSCRIPTION_CANCELLATION_REASONS,
    isKeepSubscription,
} from '../content/FeedbackDowngradeContent';
import { BugOrQualityIssueContent } from './content/BugOrQualityIssueContent';
import { ConfirmCancellationContent } from './content/ConfirmCancellationContent';
import { DifferentAccountContent } from './content/DifferentAccountContent';
import { DifferentProviderContent } from './content/DifferentProviderContent';
import { MissingFeatureContent } from './content/MissingFeatureContent';
import { OfferContent } from './content/OfferContent';
import { TemporaryNeedContent } from './content/TemporaryNeedContent';
import { useCancellationOffer } from './hooks/useCancellationOffer';

enum CANCELLATION_STEPS {
    FEEDBACK,
    MISSING_FEATURE,
    GET_HELP,
    OFFER,
    TEMPORARY_NEED,
    CONFIRM,
    DIFFERENT_ACCOUNT,
    DIFFERENT_PROVIDER,
}

interface Props extends ModalProps {
    onCancelled: () => void;
}

export const FeedbackFirstCancellation = ({ onCancelled, ...modalProps }: Props) => {
    const [step, setStep] = useState(CANCELLATION_STEPS.FEEDBACK);
    const [user] = useUser();
    const [feedback, setFeedback] = useState<FeedbackDowngradeData | undefined>();
    const [subscription] = useSubscription();
    const offerData = useCancellationOffer();
    const { cancelSubscriptionRenewal } = useCancelRenewal();

    const closeModal = () => {
        modalProps.onClose?.();
    };

    const isDrivePlan = () => {
        const planName = getPlanName(subscription);
        return planName === PLANS.DRIVE || planName === PLANS.DRIVE_1TB;
    };

    const getNextStepFromFeedback = (reason: SUBSCRIPTION_CANCELLATION_REASONS): CANCELLATION_STEPS => {
        if (isDrivePlan()) {
            return CANCELLATION_STEPS.TEMPORARY_NEED;
        }
        switch (reason) {
            case SUBSCRIPTION_CANCELLATION_REASONS.MISSING_FEATURE:
                return CANCELLATION_STEPS.MISSING_FEATURE;
            case SUBSCRIPTION_CANCELLATION_REASONS.QUALITY_ISSUE:
                return CANCELLATION_STEPS.GET_HELP;
            case SUBSCRIPTION_CANCELLATION_REASONS.SWITCHING_TO_DIFFERENT_SERVICE:
                return CANCELLATION_STEPS.DIFFERENT_PROVIDER;
            case SUBSCRIPTION_CANCELLATION_REASONS.DIFFERENT_ACCOUNT:
                return CANCELLATION_STEPS.DIFFERENT_ACCOUNT;
            case SUBSCRIPTION_CANCELLATION_REASONS.TEMPORARY:
                return CANCELLATION_STEPS.TEMPORARY_NEED;
            case SUBSCRIPTION_CANCELLATION_REASONS.TOO_EXPENSIVE:
                return offerData.offerIsAvailable ? CANCELLATION_STEPS.OFFER : CANCELLATION_STEPS.TEMPORARY_NEED;
            default:
                return CANCELLATION_STEPS.TEMPORARY_NEED;
        }
    };

    const handleFeedbackResolve = (result: FeedbackDowngradeResult) => {
        if (isKeepSubscription(result)) {
            closeModal();
            return;
        }
        setFeedback(result);

        const reason = result.Reason as SUBSCRIPTION_CANCELLATION_REASONS;
        setStep(getNextStepFromFeedback(reason));
    };

    const handleContinueToConfirm = () => {
        setStep(CANCELLATION_STEPS.CONFIRM);
    };

    return (
        <ModalTwo className="h-full" size="xlarge" {...modalProps}>
            {step === CANCELLATION_STEPS.FEEDBACK && (
                <FeedbackDowngradeContent user={user} onResolve={handleFeedbackResolve} />
            )}
            {step === CANCELLATION_STEPS.MISSING_FEATURE && (
                <MissingFeatureContent onKeepPlan={closeModal} onContinueCancelling={handleContinueToConfirm} />
            )}
            {step === CANCELLATION_STEPS.OFFER && (
                <OfferContent
                    onKeepPlan={closeModal}
                    onContinueCancelling={handleContinueToConfirm}
                    offerData={offerData}
                />
            )}
            {step === CANCELLATION_STEPS.TEMPORARY_NEED && (
                <TemporaryNeedContent onKeepPlan={closeModal} onContinueCancelling={handleContinueToConfirm} />
            )}
            {step === CANCELLATION_STEPS.DIFFERENT_ACCOUNT && (
                <DifferentAccountContent onContinueCancelling={handleContinueToConfirm} onKeepPlan={closeModal} />
            )}
            {step === CANCELLATION_STEPS.GET_HELP && (
                <BugOrQualityIssueContent onContinueCancelling={handleContinueToConfirm} onKeepPlan={closeModal} />
            )}
            {step === CANCELLATION_STEPS.DIFFERENT_PROVIDER && (
                <DifferentProviderContent
                    onKeepPlan={closeModal}
                    onContinueCancelling={handleContinueToConfirm}
                    feedbackReason={feedback?.ReasonDetails}
                />
            )}
            {step === CANCELLATION_STEPS.CONFIRM && (
                <ConfirmCancellationContent
                    onKeepPlan={closeModal}
                    onCancelSubscription={async () => {
                        await cancelSubscriptionRenewal(
                            feedback ?? { Reason: '', Feedback: '', ReasonDetails: '', Context: 'mail' },
                            false
                        );
                        closeModal();
                        onCancelled();
                    }}
                />
            )}
        </ModalTwo>
    );
};
