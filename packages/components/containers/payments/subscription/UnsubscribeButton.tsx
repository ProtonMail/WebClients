import { ReactNode } from 'react';

import { c } from 'ttag';

import { Button, ButtonProps } from '@proton/atoms';
import useFreePlan from '@proton/components/hooks/useFreePlan';
import { useLoading } from '@proton/hooks';
import { deleteSubscription } from '@proton/shared/lib/api/payments';
import { getShouldCalendarPreventSubscripitionChange } from '@proton/shared/lib/calendar/plans';
import { APP_NAMES, PLANS, PLAN_SERVICES } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { toMap } from '@proton/shared/lib/helpers/object';
import { hasBonuses } from '@proton/shared/lib/helpers/organization';
import {
    getPlan,
    hasMigrationDiscount,
    hasNewVisionary,
    isManagedExternally,
} from '@proton/shared/lib/helpers/subscription';
import { hasPaidMail } from '@proton/shared/lib/user/helpers';

import {
    useApi,
    useEventManager,
    useGetCalendars,
    useGetOrganization,
    useGetSubscription,
    useModals,
    useNotifications,
    usePlans,
    useUser,
    useVPNServersCount,
} from '../../../hooks';
import DowngradeModal from '../DowngradeModal';
import LossLoyaltyModal from '../LossLoyaltyModal';
import MemberDowngradeModal from '../MemberDowngradeModal';
import { getShortPlan } from '../features/plan';
import CalendarDowngradeModal from './CalendarDowngradeModal';
import FeedbackDowngradeModal, {
    FeedbackDowngradeData,
    FeedbackDowngradeResult,
    isKeepSubscription,
} from './FeedbackDowngradeModal';
import HighlightPlanDowngradeModal from './HighlightPlanDowngradeModal';
import InAppPurchaseModal from './InAppPurchaseModal';
import { DiscountWarningModal, NewVisionaryWarningModal } from './PlanLossWarningModal';

const { MAIL, VPN } = PLAN_SERVICES;

interface Props extends Omit<ButtonProps, 'loading' | 'onClick'> {
    children: ReactNode;
    app: APP_NAMES;
}

const UnsubscribeButton = ({ className, children, app, ...rest }: Props) => {
    const api = useApi();
    const [vpnServers] = useVPNServersCount();
    const [user] = useUser();
    const getSubscription = useGetSubscription();
    const getOrganization = useGetOrganization();
    const [plans, loadingPlans] = usePlans();
    const [freePlan, loadingFreePlan] = useFreePlan();
    const { createNotification, hideNotification } = useNotifications();
    const { createModal } = useModals();
    const { call } = useEventManager();
    const getCalendars = useGetCalendars();
    const [loading, withLoading] = useLoading();

    const plansMap = toMap(plans, 'Name');

    const handleUnsubscribe = async (data: FeedbackDowngradeData) => {
        const downgradeNotificationId = createNotification({
            type: 'info',
            text: c('State').t`Downgrading your account, please wait`,
            expiration: 99999,
        });

        try {
            await api(deleteSubscription(data));
            await call();
            createNotification({ text: c('Success').t`You have successfully unsubscribed` });
        } finally {
            hideNotification(downgradeNotificationId);
        }
    };

    const handleClick = async () => {
        if (user.isFree) {
            return createNotification({ type: 'error', text: c('Info').t`You already have a free account` });
        }

        const subscription = await getSubscription();

        // Start promise early
        const shouldCalendarPreventDowngradePromise = getShouldCalendarPreventSubscripitionChange({
            hasPaidMail: hasPaidMail(user),
            willHavePaidMail: false,
            api,
            getCalendars,
        });

        if (hasMigrationDiscount(subscription)) {
            await new Promise<void>((resolve, reject) => {
                createModal(<DiscountWarningModal type="downgrade" onClose={reject} onConfirm={resolve} />);
            });
        }

        if (hasNewVisionary(subscription)) {
            await new Promise<void>((resolve, reject) => {
                createModal(<NewVisionaryWarningModal type="downgrade" onClose={reject} onConfirm={resolve} />);
            });
        }

        if (isManagedExternally(subscription)) {
            await new Promise<void>((_, reject) => {
                createModal(<InAppPurchaseModal onClose={reject} subscription={subscription} />);
            });
        }

        const currentPlan = getPlan(subscription);
        const shortPlan = currentPlan ? getShortPlan(currentPlan.Name as PLANS, plansMap, { vpnServers }) : undefined;
        const { PeriodEnd = 0 } = subscription || {};

        // We only show the plan downgrade modal for plans that are defined with features
        if (shortPlan && freePlan) {
            await new Promise<void>((resolve, reject) => {
                createModal(
                    <HighlightPlanDowngradeModal
                        freePlan={freePlan}
                        app={app}
                        user={user}
                        plansMap={plansMap}
                        shortPlan={shortPlan}
                        periodEnd={PeriodEnd}
                        onConfirm={resolve}
                        onClose={reject}
                    />
                );
            });
        }

        if (await shouldCalendarPreventDowngradePromise) {
            await new Promise<void>((resolve, reject) => {
                createModal(<CalendarDowngradeModal isDowngrade onConfirm={resolve} onClose={reject} />);
            });
        }

        const organization = await getOrganization();

        if (hasBonuses(organization)) {
            await new Promise<void>((resolve, reject) => {
                createModal(<LossLoyaltyModal organization={organization} onConfirm={resolve} onClose={reject} />);
            });
        }

        if (organization.UsedMembers > 1) {
            await new Promise<void>((resolve, reject) => {
                createModal(<MemberDowngradeModal organization={organization} onConfirm={resolve} onClose={reject} />);
            });
        }

        const hasMail = hasBit(user.Subscribed, MAIL);
        const hasVpn = hasBit(user.Subscribed, VPN);

        if (hasMail || hasVpn) {
            await new Promise<void>((resolve, reject) => {
                createModal(<DowngradeModal hasMail={hasMail} hasVpn={hasVpn} onConfirm={resolve} onClose={reject} />);
            });
        }

        const downgradeFeedbackOrKeepSubscription = await new Promise<FeedbackDowngradeResult>((resolve, reject) => {
            createModal(<FeedbackDowngradeModal user={user} onResolve={resolve} onReject={reject} />);
        });
        if (isKeepSubscription(downgradeFeedbackOrKeepSubscription)) {
            return;
        }

        return handleUnsubscribe(downgradeFeedbackOrKeepSubscription);
    };

    return (
        <Button
            disabled={loading || loadingPlans}
            className={className}
            onClick={() => withLoading(handleClick())}
            data-testid="UnsubscribeButton"
            {...rest}
        >
            {children}
        </Button>
    );
};

export default UnsubscribeButton;
