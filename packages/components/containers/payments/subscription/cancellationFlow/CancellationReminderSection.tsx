import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { addDays, fromUnixTime, isBefore } from 'date-fns';
import { c } from 'ttag';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { PLANS } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { MailFeatureFlag } from '@proton/unleash/Flags';
import { useFlag } from '@proton/unleash/useFlag';

import SettingsLink from '../../../../components/link/SettingsLink';
import useSettingsLink from '../../../../components/link/useSettingsLink';
import useModalState from '../../../../components/modalTwo/useModalState';
import useAppTitle from '../../../../hooks/useAppTitle';
import { useCancelSubscriptionFlow } from '../cancelSubscription/useCancelSubscriptionFlow';
import { useSubscriptionModalRaw } from '../subscriptionModalContext';
import useSubscriptionModalTelemetry from '../useSubscriptionModalTelemetry';
import CancelConfirmationModal from './CancelConfirmationModal';
import { CancelRedirectionModal } from './CancelRedirectionModal';
import ReminderSectionFeatures from './ReminderSectionFeatures';
import ReminderSectionPlan from './ReminderSectionPlan';
import ReminderSectionTestimonials from './ReminderSectionTestimonials';
import { getSubscriptionForCancelRoute } from './helper';
import { getReminderPageConfig } from './reminderPageConfig';
import useCancellationFlow, { getCanUseCancellationReminder } from './useCancellationFlow';
import useCancellationTelemetry from './useCancellationTelemetry';

interface Props {
    app: APP_NAMES;
}

interface ContentProps extends Props {
    subscription: Subscription;
}

const CancellationReminderContent = ({ app, subscription }: ContentProps) => {
    const { reportCancellationOnSameDay } = useSubscriptionModalTelemetry();
    const openSubscriptionModal = useSubscriptionModalRaw();
    const { redirectToDashboard, startedCancellation, setStartedCancellation } = useCancellationFlow();
    const hasAccess = startedCancellation || getCanUseCancellationReminder(subscription);
    const { sendCancelPageKeepPlanReport, sendCancelPageConfirmCancelReport } = useCancellationTelemetry();

    const { cancelSubscription, cancelSubscriptionModals } = useCancelSubscriptionFlow({
        app,
    });

    const [cancelModalProps, setCancelModalOpen, cancelRenderModal] = useModalState();
    const [redirectModalProps, setRedirectModalOpen, redirectRenderModal] = useModalState();

    const scribeToLumo = useFlag(MailFeatureFlag.ScribeToLumo);

    const [config, setConfig] = useState<ReturnType<typeof getReminderPageConfig> | null>(
        getReminderPageConfig({ app, subscription, scribeToLumo })
    );

    const goToSettings = useSettingsLink();

    useEffect(() => {
        const newConfig = getReminderPageConfig({ app, subscription, scribeToLumo });
        setConfig(newConfig);
    }, [hasAccess]);

    useAppTitle(c('Subscription reminder').t`Cancel subscription`);

    const isUpsellEnabled = useFlag('NewCancellationFlowUpsell');

    if (!hasAccess || !config) {
        redirectToDashboard();
        return null;
    }

    const handleCancelSubscription = async () => {
        setCancelModalOpen(false);
        // We inform that the cancellation process was started to avoid redirection once finished
        setStartedCancellation(true);

        const isSubscriptionReminderFlow = !isUpsellEnabled || !config.upsellPlan;

        const hasCancelledOnSameDayHeSubscribed =
            subscription.CreateTime && isBefore(new Date(), addDays(fromUnixTime(subscription.CreateTime), 1));
        const { status } = await cancelSubscription({
            subscription,
            subscriptionReminderFlow: isSubscriptionReminderFlow,
            upsellPlanId: config.upsellPlan,
        });

        if (hasCancelledOnSameDayHeSubscribed) {
            void reportCancellationOnSameDay();
        }

        if (status === 'cancelled') {
            setRedirectModalOpen(true);
        } else if (status === 'upsold') {
            void openSubscriptionModal({
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                disablePlanSelection: true,
                plan: config.upsellPlan,
                onClose: () => {
                    goToSettings('/dashboard');
                },
            });
        } else {
            goToSettings('/dashboard');
        }

        setStartedCancellation(false);
    };

    const keepSubscription = c('Subscription reminder').t`Keep subscription`;
    // Translator: Text is "Keep " followed by the plan name.
    const keepPlanName = c('Subscription reminder').t`Keep ${config.planName}`;
    const ctaText = config.plan === PLANS.BUNDLE ? keepSubscription : keepPlanName;

    return (
        <>
            <div className="overflow-auto" data-testid="cancellation-flow:reminder-container">
                <div className="container-section-sticky">
                    <ReminderSectionPlan {...config.reminder} />
                    <div className="columns-1 md:columns-2 gap-10 mt-6">
                        <ReminderSectionFeatures {...config.features} />
                        <ReminderSectionTestimonials {...config.testimonials} />
                    </div>
                    <div className="flex justify-center gap-4 mb-8">
                        <ButtonLike
                            as={SettingsLink}
                            onClick={() => {
                                sendCancelPageKeepPlanReport();
                            }}
                            path="/dashboard"
                            shape="outline"
                            color="weak"
                            className="flex flex-nowrap gap-2 items-center justify-center"
                        >
                            {c('Subscription reminder').t`Keep subscription`}
                        </ButtonLike>

                        <Button
                            color="danger"
                            data-testid="cancellation-flow:confirm-cancellation"
                            onClick={() => {
                                sendCancelPageConfirmCancelReport();
                                setCancelModalOpen(true);
                            }}
                        >{c('Subscription reminder').t`Cancel subscription`}</Button>
                    </div>
                </div>
            </div>
            {cancelRenderModal && (
                <CancelConfirmationModal
                    {...cancelModalProps}
                    ctaText={ctaText}
                    cancelSubscription={async () => {
                        await handleCancelSubscription();
                    }}
                    {...config.confirmationModal}
                />
            )}
            {redirectRenderModal && (
                <CancelRedirectionModal
                    {...redirectModalProps}
                    subscription={subscription}
                    planName={config.planName}
                    plan={config.plan}
                />
            )}

            {cancelSubscriptionModals}
        </>
    );
};

export const CancellationReminderSection = ({ app }: Props) => {
    const location = useLocation();
    const [subscriptions, loadingSubscriptions] = useAllSubscriptions();
    const { redirectToDashboard } = useCancellationFlow();

    if (loadingSubscriptions) {
        return null;
    }

    const subscription = getSubscriptionForCancelRoute(subscriptions ?? [], location.search);
    if (!subscription) {
        redirectToDashboard();
        return null;
    }

    return <CancellationReminderContent app={app} subscription={subscription} />;
};
