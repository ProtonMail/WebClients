import { c } from 'ttag';

import { useModalState } from '@proton/components/components';
import { isSplittedUser, onSessionMigrationPaymentsVersion } from '@proton/components/payments/core';
import type { PaymentsVersion } from '@proton/shared/lib/api/payments';
import { changeRenewState, deleteSubscription } from '@proton/shared/lib/api/payments';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { getShouldCalendarPreventSubscripitionChange } from '@proton/shared/lib/calendar/plans';
import type { PLANS } from '@proton/shared/lib/constants';
import { PLAN_SERVICES, isFreeSubscription } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { hasBonuses } from '@proton/shared/lib/helpers/organization';
import {
    getPlan,
    hasCancellablePlan,
    hasMigrationDiscount,
    hasVisionary,
    isManagedExternally,
} from '@proton/shared/lib/helpers/subscription';
import { Renew } from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import { hasPaidMail } from '@proton/shared/lib/user/helpers';

import { useModalTwoPromise } from '../../../../components/modalTwo/useModalTwo';
import {
    useApi,
    useEventManager,
    useGetCalendars,
    useGetSubscription,
    useGetUser,
    useNotifications,
    useOrganization,
    usePlans,
    usePreferredPlansMap,
    useSubscription,
    useUser,
    useVPNServersCount,
} from '../../../../hooks';
import DowngradeModal from '../../DowngradeModal';
import LossLoyaltyModal from '../../LossLoyaltyModal';
import MemberDowngradeModal from '../../MemberDowngradeModal';
import { getShortPlan } from '../../features/plan';
import CalendarDowngradeModal from '../CalendarDowngradeModal';
import type { FeedbackDowngradeData, FeedbackDowngradeResult } from '../FeedbackDowngradeModal';
import FeedbackDowngradeModal, { isKeepSubscription } from '../FeedbackDowngradeModal';
import type { HighlightPlanDowngradeModalOwnProps } from '../HighlightPlanDowngradeModal';
import HighlightPlanDowngradeModal from '../HighlightPlanDowngradeModal';
import InAppPurchaseModal from '../InAppPurchaseModal';
import { DiscountWarningModal, VisionaryWarningModal } from '../PlanLossWarningModal';
import CancelSubscriptionLoadingModal from './CancelSubscriptionLoadingModal';
import { CancelSubscriptionModal } from './CancelSubscriptionModal';
import type { CancelSubscriptionResult } from './types';

const SUBSCRIPTION_KEPT: CancelSubscriptionResult = {
    status: 'kept',
};
const SUBSCRIPTION_DOWNGRADED: CancelSubscriptionResult = {
    status: 'downgraded',
};

const SUBSCRIPTION_CANCELLED: CancelSubscriptionResult = {
    status: 'cancelled',
};

interface Props {
    app: ProductParam;
}

/**
 * This hook will handle cancellation flow. It will display the cancellation modal and the feedback modal.
 * Use this hook if you need to implement cancellation flow elsewhere. It will help to be consistent in terms of UX
 * and expectations of the internal stakeholders.
 * @returns {cancelSubscriptionModals, cancelSubscription}
 * cancelSubscriptionModals: the modals to display – just render them in your component by returning them
 * cancelSubscription: the function to call to cancel the subscription.
 */
export const useCancelSubscriptionFlow = ({ app }: Props) => {
    const [user] = useUser();
    const getSubscription = useGetSubscription();
    const getUser = useGetUser();
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();
    const [plansResult, loadingPlans] = usePlans();
    const eventManager = useEventManager();
    const getCalendars = useGetCalendars();
    const [vpnServers] = useVPNServersCount();
    const api = useApi();
    const freePlan = plansResult?.freePlan || FREE_PLAN;
    const { plansMap, plansMapLoading } = usePreferredPlansMap();

    const [cancelSubscriptionModal, showCancelSubscriptionModal] = useModalTwoPromise<
        undefined,
        CancelSubscriptionResult
    >();
    const [feedbackDowngradeModal, showFeedbackDowngradeModal] = useModalTwoPromise<
        undefined,
        FeedbackDowngradeResult
    >();
    const [discountWarningModal, showDiscountWarningModal] = useModalTwoPromise();
    const [visionaryWarningModal, showVisionaryWarningModal] = useModalTwoPromise();
    const [inAppPurchaseModal, showInAppPurchaseModal] = useModalTwoPromise();
    const [highlightPlanDowngradeModal, showHighlightPlanDowngradeModal] =
        useModalTwoPromise<HighlightPlanDowngradeModalOwnProps>();
    const [calendarDowngradeModal, showCalendarDowngradeModal] = useModalTwoPromise();
    const [lossLoyaltyModal, showLossLoyaltyModal] = useModalTwoPromise();
    const [memberDowngradeModal, showMemberDowngradeModal] = useModalTwoPromise();
    const [downgradeModal, showDowngradeModal] = useModalTwoPromise<{ hasMail: boolean; hasVpn: boolean }>();
    const [cancellationLoadingModal, showCancellationLoadingModal, renderCancellationLoadingModal] = useModalState();

    const { createNotification, hideNotification } = useNotifications();

    const modals = (
        <>
            {downgradeModal((props) => {
                return <DowngradeModal {...props} onConfirm={props.onResolve} onClose={props.onReject} />;
            })}

            {organization &&
                memberDowngradeModal((props) => {
                    return (
                        <MemberDowngradeModal
                            organization={organization}
                            {...props}
                            onConfirm={props.onResolve}
                            onClose={props.onReject}
                        />
                    );
                })}
            {organization &&
                lossLoyaltyModal((props) => {
                    return (
                        <LossLoyaltyModal
                            organization={organization}
                            {...props}
                            onConfirm={props.onResolve}
                            onClose={props.onReject}
                        />
                    );
                })}
            {calendarDowngradeModal((props) => {
                return (
                    <CalendarDowngradeModal
                        isDowngrade
                        {...props}
                        onConfirm={props.onResolve}
                        onClose={props.onReject}
                    />
                );
            })}
            {highlightPlanDowngradeModal((props) => {
                return <HighlightPlanDowngradeModal {...props} onConfirm={props.onResolve} onClose={props.onReject} />;
            })}
            {subscription &&
                inAppPurchaseModal((props) => {
                    return <InAppPurchaseModal {...props} subscription={subscription} onClose={props.onReject} />;
                })}
            {visionaryWarningModal((props) => {
                return (
                    <VisionaryWarningModal
                        {...props}
                        type="downgrade"
                        onConfirm={props.onResolve}
                        onClose={props.onReject}
                    />
                );
            })}
            {discountWarningModal((props) => {
                return (
                    <DiscountWarningModal
                        {...props}
                        type="downgrade"
                        onConfirm={props.onResolve}
                        onClose={props.onReject}
                    />
                );
            })}
            {renderCancellationLoadingModal && <CancelSubscriptionLoadingModal {...cancellationLoadingModal} />}
            {subscription &&
                cancelSubscriptionModal((props) => {
                    return <CancelSubscriptionModal subscription={subscription} {...props} />;
                })}
            {feedbackDowngradeModal((props) => {
                return <FeedbackDowngradeModal user={user} {...props} />;
            })}
        </>
    );

    const cancelRenew = async (
        subscriptionReminderFlow: boolean | undefined,
        paymentsVersionOverride: PaymentsVersion | undefined
    ) => {
        if (!subscriptionReminderFlow) {
            const result = await showCancelSubscriptionModal();

            if (result.status === 'kept') {
                return SUBSCRIPTION_KEPT;
            }
        }

        const feedback = await showFeedbackDowngradeModal();
        if (isKeepSubscription(feedback)) {
            return SUBSCRIPTION_KEPT;
        }

        const cancelNotificationId = createNotification({
            type: 'info',
            text: c('State').t`Canceling your subscription, please wait`,
            expiration: 99999,
        });

        try {
            await api(
                changeRenewState(
                    {
                        RenewalState: Renew.Disabled,
                        CancellationFeedback: feedback,
                    },
                    paymentsVersionOverride ?? onSessionMigrationPaymentsVersion(user, subscription)
                )
            );
            await eventManager.call();
            createNotification({ text: c('Success').t`You have successfully canceled your subscription.` });
        } finally {
            hideNotification(cancelNotificationId);
        }

        return SUBSCRIPTION_CANCELLED;
    };

    const handleFinalizeUnsubscribe = async (data: FeedbackDowngradeData) => {
        try {
            showCancellationLoadingModal(true);
            await api(deleteSubscription(data, onSessionMigrationPaymentsVersion(user, subscription)));
            await eventManager.call();
            createNotification({ text: c('Success').t`You have successfully unsubscribed` });
            return SUBSCRIPTION_DOWNGRADED;
        } finally {
            showCancellationLoadingModal(false);
        }
    };

    const handleUnsubscribe = async (subscriptionReminderFlow: boolean = false) => {
        const shouldCalendarPreventDowngradePromise = getShouldCalendarPreventSubscripitionChange({
            hasPaidMail: hasPaidMail(user),
            willHavePaidMail: false,
            api,
            getCalendars,
        });

        if (hasMigrationDiscount(subscription)) {
            await showDiscountWarningModal();
        }

        if (hasVisionary(subscription)) {
            await showVisionaryWarningModal();
        }

        if (isManagedExternally(subscription)) {
            await showInAppPurchaseModal();
        }

        const { PeriodEnd = 0 } = subscription || {};
        const currentPlan = getPlan(subscription);
        const shortPlan = currentPlan
            ? getShortPlan(currentPlan.Name as PLANS, plansMap, {
                  vpnServers,
                  freePlan,
              })
            : undefined;

        // We only show the plan downgrade modal for plans that are defined with features
        if (shortPlan && !subscriptionReminderFlow) {
            await showHighlightPlanDowngradeModal({
                user,
                plansMap,
                app,
                shortPlan,
                periodEnd: PeriodEnd,
                freePlan,
            });
        }

        if (await shouldCalendarPreventDowngradePromise) {
            await showCalendarDowngradeModal();
        }

        if (hasBonuses(organization)) {
            await showLossLoyaltyModal();
        }

        if ((organization?.UsedMembers ?? 0) > 1) {
            await showMemberDowngradeModal();
        }

        const hasMail = hasBit(user.Subscribed, PLAN_SERVICES.MAIL);
        const hasVpn = hasBit(user.Subscribed, PLAN_SERVICES.VPN);

        if ((hasMail || hasVpn) && !subscriptionReminderFlow) {
            await showDowngradeModal({ hasMail, hasVpn });
        }

        const feedback = await showFeedbackDowngradeModal();
        if (isKeepSubscription(feedback)) {
            return SUBSCRIPTION_KEPT;
        }

        return handleFinalizeUnsubscribe(feedback);
    };

    return {
        loadingCancelSubscription: loadingOrganization || loadingSubscription || loadingPlans || plansMapLoading,
        cancelSubscriptionModals: modals,
        cancelSubscription: async (subscriptionReminderFlow?: boolean) => {
            const [subscription, user] = await Promise.all([getSubscription(), getUser()]);
            if (user.isFree || isFreeSubscription(subscription)) {
                createNotification({ type: 'error', text: c('Info').t`You already have a free account` });
                return SUBSCRIPTION_KEPT;
            }

            if (hasCancellablePlan(subscription, user)) {
                if (subscription.Renew === Renew.Disabled) {
                    return SUBSCRIPTION_KEPT;
                }

                const paymentsVersionOverride: PaymentsVersion | undefined = isSplittedUser(
                    user.ChargebeeUser,
                    user.ChargebeeUserExists,
                    subscription?.BillingPlatform
                )
                    ? 'v4'
                    : undefined;

                return cancelRenew(subscriptionReminderFlow, paymentsVersionOverride);
            }

            return handleUnsubscribe(subscriptionReminderFlow);
        },
    };
};
