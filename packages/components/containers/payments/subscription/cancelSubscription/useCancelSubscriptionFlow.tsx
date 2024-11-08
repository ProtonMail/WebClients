import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { usePlans } from '@proton/account/plans/hooks';
import { useGetSubscription, useSubscription } from '@proton/account/subscription/hooks';
import { useGetUser, useUser } from '@proton/account/user/hooks';
import { useGetCalendars } from '@proton/calendar/calendars/hooks';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { useModalTwo, useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';
import useApi from '@proton/components/hooks/useApi';
import useEventManager from '@proton/components/hooks/useEventManager';
import useNotifications from '@proton/components/hooks/useNotifications';
import { usePreferredPlansMap } from '@proton/components/hooks/usePreferredPlansMap';
import useVPNServersCount from '@proton/components/hooks/useVPNServersCount';
import { type PLANS, isFreeSubscription, isSplittedUser, onSessionMigrationPaymentsVersion } from '@proton/payments';
import type { PaymentsVersion } from '@proton/shared/lib/api/payments';
import { changeRenewState, deleteSubscription } from '@proton/shared/lib/api/payments';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { getShouldCalendarPreventSubscripitionChange } from '@proton/shared/lib/calendar/plans';
import { APPS } from '@proton/shared/lib/constants';
import { hasBonuses } from '@proton/shared/lib/helpers/organization';
import {
    getPlan,
    getPlanName,
    hasCancellablePlan,
    hasMigrationDiscount,
    hasPassLaunchOffer,
    isManagedExternally,
} from '@proton/shared/lib/helpers/subscription';
import type { SubscriptionModel } from '@proton/shared/lib/interfaces';
import { Renew } from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import { hasPaidMail, hasPaidVpn } from '@proton/shared/lib/user/helpers';
import { useFlag } from '@proton/unleash';

import DowngradeModal from '../../DowngradeModal';
import LossLoyaltyModal from '../../LossLoyaltyModal';
import MemberDowngradeModal from '../../MemberDowngradeModal';
import PassLaunchOfferDowngradeModal from '../../PassLaunchOfferDowngradeModal';
import { getShortPlan } from '../../features/plan';
import CalendarDowngradeModal from '../CalendarDowngradeModal';
import type { FeedbackDowngradeData, FeedbackDowngradeResult } from '../FeedbackDowngradeModal';
import FeedbackDowngradeModal, { isKeepSubscription } from '../FeedbackDowngradeModal';
import type { HighlightPlanDowngradeModalOwnProps } from '../HighlightPlanDowngradeModal';
import HighlightPlanDowngradeModal, { planSupportsCancellationDowngradeModal } from '../HighlightPlanDowngradeModal';
import InAppPurchaseModal from '../InAppPurchaseModal';
import { DiscountWarningModal } from '../PlanLossWarningModal';
import UpsellModal from '../UpsellModal';
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

const SUBSCRIPTION_UPSOLD: CancelSubscriptionResult = {
    status: 'upsold',
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
    const plans = plansResult?.plans ?? [];
    const { plansMap, plansMapLoading } = usePreferredPlansMap();
    const currentPlanId = getPlanName(subscription);
    const isUpsellEnabled = useFlag('NewCancellationFlowUpsell');
    const canUseUpsellFlow = isUpsellEnabled && app === APPS.PROTONMAIL;

    const [cancelSubscriptionModal, showCancelSubscriptionModal] = useModalTwoPromise<
        undefined,
        CancelSubscriptionResult
    >();
    const [feedbackDowngradeModal, showFeedbackDowngradeModal] = useModalTwoPromise<
        undefined,
        FeedbackDowngradeResult
    >();
    const [upsellModal, showUpsellModal] = useModalTwo(UpsellModal);
    const [discountWarningModal, showDiscountWarningModal] = useModalTwoPromise();
    const [inAppPurchaseModal, showInAppPurchaseModal] = useModalTwoPromise();
    const [highlightPlanDowngradeModal, showHighlightPlanDowngradeModal] =
        useModalTwoPromise<HighlightPlanDowngradeModalOwnProps>();
    const [calendarDowngradeModal, showCalendarDowngradeModal] = useModalTwoPromise();
    const [lossLoyaltyModal, showLossLoyaltyModal] = useModalTwoPromise();
    const [memberDowngradeModal, showMemberDowngradeModal] = useModalTwoPromise();
    const [passLaunchOfferDowngradeModal, showPassLaunchDowngradeModal] = useModalTwoPromise();
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

            {currentPlanId ? upsellModal : null}
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
            {subscription &&
                passLaunchOfferDowngradeModal((props) => {
                    return (
                        <PassLaunchOfferDowngradeModal
                            {...props}
                            subscription={subscription}
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

    interface CancellationProps {
        feedback?: FeedbackDowngradeResult;
        paymentsVersionOverride: PaymentsVersion | undefined;
    }

    const finaliseCancellation = async (cancellationProps: CancellationProps) => {
        let cancelNotificationId;

        try {
            let { feedback } = cancellationProps;

            if (!feedback) {
                feedback = await showFeedbackDowngradeModal();
                if (isKeepSubscription(feedback)) {
                    return SUBSCRIPTION_KEPT;
                }
            }

            cancelNotificationId = createNotification({
                type: 'info',
                text: c('State').t`Canceling your subscription, please wait`,
                expiration: 99999,
            });

            await api(
                changeRenewState(
                    {
                        RenewalState: Renew.Disabled,
                        CancellationFeedback: feedback as FeedbackDowngradeData,
                    },
                    cancellationProps.paymentsVersionOverride ?? onSessionMigrationPaymentsVersion(user, subscription)
                )
            );
            await eventManager.call();

            createNotification({ text: c('Success').t`You have successfully canceled your subscription.` });
        } finally {
            if (cancelNotificationId) {
                hideNotification(cancelNotificationId);
            }
        }

        return SUBSCRIPTION_CANCELLED;
    };

    interface CancelWithUpsellProps {
        paymentsVersionOverride: PaymentsVersion | undefined;
        subscription: SubscriptionModel;
        upsellPlanId: PLANS | undefined;
    }

    const cancelWithUpsell = async ({ paymentsVersionOverride, subscription, upsellPlanId }: CancelWithUpsellProps) => {
        if (!currentPlanId) {
            return SUBSCRIPTION_KEPT;
        }

        const resolution = upsellPlanId
            ? await showUpsellModal({
                  freePlan,
                  plans,
                  subscription,
                  upsellPlanId,
              })
            : SUBSCRIPTION_CANCELLED;

        if (resolution.status === SUBSCRIPTION_KEPT.status) {
            return SUBSCRIPTION_KEPT;
        }

        if (resolution.status === SUBSCRIPTION_CANCELLED.status) {
            return finaliseCancellation({ paymentsVersionOverride });
        }
        return SUBSCRIPTION_UPSOLD;
    };

    interface CancelRenewProps {
        paymentsVersionOverride: PaymentsVersion | undefined;
        skipUpsell?: boolean;
        subscription: SubscriptionModel;
        subscriptionReminderFlow: boolean | undefined;
        upsellPlanId: PLANS | undefined;
    }

    const cancelRenew = async ({
        paymentsVersionOverride,
        skipUpsell,
        subscription,
        subscriptionReminderFlow,
        upsellPlanId,
    }: CancelRenewProps) => {
        if (!subscriptionReminderFlow) {
            if (canUseUpsellFlow && !skipUpsell) {
                return cancelWithUpsell({ paymentsVersionOverride, subscription, upsellPlanId });
            } else {
                const result = await showCancelSubscriptionModal();

                if (result.status === 'kept') {
                    return SUBSCRIPTION_KEPT;
                }
            }
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
        if (shortPlan && !subscriptionReminderFlow && planSupportsCancellationDowngradeModal(shortPlan.plan)) {
            try {
                await showHighlightPlanDowngradeModal({
                    user,
                    plansMap,
                    app,
                    shortPlan,
                    periodEnd: PeriodEnd,
                    freePlan,
                    cancellationFlow: true,
                    subscription,
                });
            } catch {
                return SUBSCRIPTION_KEPT;
            }
        }

        if (hasPassLaunchOffer(subscription)) {
            try {
                await showPassLaunchDowngradeModal();
            } catch {
                return SUBSCRIPTION_KEPT;
            }
        }

        const feedback = await showFeedbackDowngradeModal();
        if (isKeepSubscription(feedback)) {
            return SUBSCRIPTION_KEPT;
        }

        return finaliseCancellation({ feedback, paymentsVersionOverride });
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
                cancellationFlow: false,
                subscription,
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

        const hasMail = hasPaidMail(user);
        const hasVpn = hasPaidVpn(user);

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
        cancelSubscription: async (subscriptionReminderFlow?: boolean, upsellPlanId?: PLANS, skipUpsell?: boolean) => {
            const [subscription, user] = await Promise.all([getSubscription(), getUser()]);
            if (user.isFree || isFreeSubscription(subscription)) {
                createNotification({ type: 'error', text: c('Info').t`You already have a free account` });
                return SUBSCRIPTION_KEPT;
            }

            if (isManagedExternally(subscription)) {
                await showInAppPurchaseModal();
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

                return cancelRenew({
                    paymentsVersionOverride,
                    skipUpsell,
                    subscription,
                    subscriptionReminderFlow,
                    upsellPlanId,
                });
            }

            return handleUnsubscribe(subscriptionReminderFlow);
        },
    };
};
