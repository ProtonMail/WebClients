import { c } from 'ttag';

import { useModalState } from '@proton/components/components';
import { changeRenewState, deleteSubscription } from '@proton/shared/lib/api/payments';
import { ProductParam } from '@proton/shared/lib/apps/product';
import { getShouldCalendarPreventSubscripitionChange } from '@proton/shared/lib/calendar/plans';
import { PLANS, PLAN_SERVICES, isFreeSubscription } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { toMap } from '@proton/shared/lib/helpers/object';
import { hasBonuses } from '@proton/shared/lib/helpers/organization';
import {
    getPlan,
    hasCancellablePlan,
    hasMigrationDiscount,
    hasNewVisionary,
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
    useSubscription,
    useUser,
    useVPNServersCount,
} from '../../../../hooks';
import DowngradeModal from '../../DowngradeModal';
import LossLoyaltyModal from '../../LossLoyaltyModal';
import MemberDowngradeModal from '../../MemberDowngradeModal';
import { getShortPlan } from '../../features/plan';
import CalendarDowngradeModal from '../CalendarDowngradeModal';
import CancelSubscriptionLoadingModal from '../CancelSubscriptionLoadingModal';
import FeedbackDowngradeModal, {
    FeedbackDowngradeData,
    FeedbackDowngradeResult,
    isKeepSubscription,
} from '../FeedbackDowngradeModal';
import HighlightPlanDowngradeModal, { HighlightPlanDowngradeModalOwnProps } from '../HighlightPlanDowngradeModal';
import InAppPurchaseModal from '../InAppPurchaseModal';
import { DiscountWarningModal, NewVisionaryWarningModal } from '../PlanLossWarningModal';
import { CancelSubscriptionModal } from './CancelSubscriptionModal';
import { CancelSubscriptionResult } from './types';

const SUBSCRIPTION_KEPT: CancelSubscriptionResult = {
    status: 'kept',
};
const SUBSCRIPTION_DOWNGRADED: CancelSubscriptionResult = {
    status: 'downgraded',
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
    const plans = plansResult?.plans || [];
    const freePlan = plansResult?.freePlan || FREE_PLAN;
    const plansMap = toMap(plans, 'Name');

    const [cancelSubscriptionModal, showCancelSubscriptionModal] = useModalTwoPromise<
        undefined,
        CancelSubscriptionResult
    >();
    const [feedbackDowngradeModal, showFeedbackDowngradeModal] = useModalTwoPromise<
        undefined,
        FeedbackDowngradeResult
    >();
    const [discountWarningModal, showDiscountWarningModal] = useModalTwoPromise();
    const [newVisionaryWarningModal, showNewVisionaryWarningModal] = useModalTwoPromise();
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
            {newVisionaryWarningModal((props) => {
                return (
                    <NewVisionaryWarningModal
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

    const cancelRenew = async () => {
        const result = await showCancelSubscriptionModal();
        if (result.status === 'kept') {
            return SUBSCRIPTION_KEPT;
        }

        const feedback = await showFeedbackDowngradeModal();
        if (isKeepSubscription(feedback)) {
            return SUBSCRIPTION_KEPT;
        }

        const cancelNotificationId = createNotification({
            type: 'info',
            text: c('State').t`Cancelling your subscription, please wait`,
            expiration: 99999,
        });

        try {
            await api(
                changeRenewState({
                    RenewalState: Renew.Disabled,
                    CancellationFeedback: feedback,
                })
            );
            await eventManager.call();
            createNotification({ text: c('Success').t`You have successfully cancelled your subscription.` });
        } finally {
            hideNotification(cancelNotificationId);
        }

        return result;
    };

    const handleFinalizeUnsubscribe = async (data: FeedbackDowngradeData) => {
        try {
            showCancellationLoadingModal(true);
            await api(deleteSubscription(data));
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

        if (hasNewVisionary(subscription)) {
            await showNewVisionaryWarningModal();
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
        loadingCancelSubscription: loadingOrganization || loadingSubscription || loadingPlans,
        cancelSubscriptionModals: modals,
        cancelSubscription: async (subscriptionReminderFlow?: boolean) => {
            const [subscription, user] = await Promise.all([getSubscription(), getUser()]);
            if (user.isFree || isFreeSubscription(subscription)) {
                createNotification({ type: 'error', text: c('Info').t`You already have a free account` });
                return SUBSCRIPTION_KEPT;
            }

            if (hasCancellablePlan(subscription)) {
                if (subscription.Renew === Renew.Disabled) {
                    return SUBSCRIPTION_KEPT;
                }
                return cancelRenew();
            }
            return handleUnsubscribe(subscriptionReminderFlow);
        },
    };
};
