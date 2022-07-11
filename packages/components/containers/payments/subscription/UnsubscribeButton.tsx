import { ReactNode } from 'react';
import { c } from 'ttag';
import { deleteSubscription } from '@proton/shared/lib/api/payments';
import { hasBonuses } from '@proton/shared/lib/helpers/organization';
import { getShouldCalendarPreventSubscripitionChange } from '@proton/shared/lib/calendar/subscription';
import { hasMigrationDiscount, hasNewVisionary } from '@proton/shared/lib/helpers/subscription';
import { PLANS, PLAN_SERVICES } from '@proton/shared/lib/constants';
import { toMap } from '@proton/shared/lib/helpers/object';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { hasPaidMail } from '@proton/shared/lib/user/helpers';

import Button, { ButtonProps } from '../../../components/button/Button';
import {
    useApi,
    useUser,
    useNotifications,
    useLoading,
    useModals,
    useEventManager,
    useOrganization,
    usePlans,
    useSubscription,
    useVPNCountriesCount,
    useVPNServersCount,
    useGetCalendars,
} from '../../../hooks';
import LossLoyaltyModal from '../LossLoyaltyModal';
import DowngradeModal from '../DowngradeModal';
import HighlightPlanDowngradeModal from './HighlightPlanDowngradeModal';
import CalendarDowngradeModal from './CalendarDowngradeModal';
import MemberDowngradeModal from '../MemberDowngradeModal';
import { DiscountWarningModal, NewVisionaryWarningModal } from './PlanLossWarningModal';
import FeedbackDowngradeModal, { FeedbackDowngradeData } from './FeedbackDowngradeModal';
import { getShortPlan } from '../features/plan';
import { formatPlans } from './helpers';

const { MAIL, VPN } = PLAN_SERVICES;

interface Props extends Omit<ButtonProps, 'loading' | 'onClick'> {
    children: ReactNode;
}

const UnsubscribeButton = ({ className, children, ...rest }: Props) => {
    const [user] = useUser();
    const [subscription, loadingSubscription] = useSubscription();
    const [organization] = useOrganization();
    const [plans, loadingPlans] = usePlans();
    const [vpnCountries] = useVPNCountriesCount();
    const [vpnServers] = useVPNServersCount();
    const { createNotification, hideNotification } = useNotifications();
    const { createModal } = useModals();
    const api = useApi();
    const { call } = useEventManager();
    const getCalendars = useGetCalendars();
    const [loading, withLoading] = useLoading();

    const { Plans = [], PeriodEnd = 0 } = subscription || {};
    const { plan } = formatPlans(Plans);

    const currentPlan = plan;
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

        const shortPlan = currentPlan
            ? getShortPlan(currentPlan.Name as PLANS, plansMap, vpnCountries, vpnServers)
            : undefined;
        // We only show the plan downgrade plan modal for plans that are defined with features
        if (shortPlan) {
            await new Promise<void>((resolve, reject) => {
                createModal(
                    <HighlightPlanDowngradeModal
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
                createModal(<CalendarDowngradeModal isDowngrade onConfirm={reject} onClose={reject} />);
            });
        }

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

        const data = await new Promise<FeedbackDowngradeData>((resolve, reject) => {
            createModal(<FeedbackDowngradeModal user={user} onSubmit={resolve} onClose={reject} />);
        });

        return handleUnsubscribe(data);
    };

    return (
        <Button
            disabled={loading || loadingPlans || loadingSubscription}
            className={className}
            onClick={() => withLoading(handleClick())}
            {...rest}
        >
            {children}
        </Button>
    );
};

export default UnsubscribeButton;
