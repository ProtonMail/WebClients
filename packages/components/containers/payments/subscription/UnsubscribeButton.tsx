import { ReactNode } from 'react';
import { c } from 'ttag';
import { getCalendars } from '@proton/shared/lib/models/calendarsModel';
import { deleteSubscription } from '@proton/shared/lib/api/payments';
import { hasBonuses } from '@proton/shared/lib/helpers/organization';
import { MAX_CALENDARS_PER_FREE_USER } from '@proton/shared/lib/calendar/constants';
import { Calendar, CalendarUrlsResponse } from '@proton/shared/lib/interfaces/calendar';
import { getPublicLinks } from '@proton/shared/lib/api/calendars';
import { getIsPersonalCalendar } from '@proton/shared/lib/calendar/subscribe/helpers';
import { unary } from '@proton/shared/lib/helpers/function';
import { hasMigrationDiscount, hasNewVisionary } from '@proton/shared/lib/helpers/subscription';
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
} from '../../../hooks';
import LossLoyaltyModal from '../LossLoyaltyModal';
import DowngradeModal from '../DowngradeModal';
import HighlightPlanDowngradeModal from './HighlightPlanDowngradeModal';
import CalendarDowngradeModal from './CalendarDowngradeModal';
import MemberDowngradeModal from '../MemberDowngradeModal';
import { DiscountWarningModal, NewVisionaryWarningModal } from './PlanLossWarningModal';
import FeedbackDowngradeModal, { FeedbackDowngradeData } from './FeedbackDowngradeModal';

interface Props extends Omit<ButtonProps, 'loading' | 'onClick'> {
    children: ReactNode;
}

const UnsubscribeButton = ({ className, children, ...rest }: Props) => {
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [organization] = useOrganization();
    const [plans] = usePlans();
    const { createNotification, hideNotification } = useNotifications();
    const { createModal } = useModals();
    const api = useApi();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();

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
        const calendarPromise = (async () => {
            const calendars: Calendar[] = await getCalendars(api);
            const personalCalendars = calendars.filter(unary(getIsPersonalCalendar));

            const hasLinks = !!(
                await Promise.all(
                    personalCalendars.map((calendar) => api<CalendarUrlsResponse>(getPublicLinks(calendar.ID)))
                )
            ).flatMap(({ CalendarUrls }) => CalendarUrls).length;

            return personalCalendars.length > MAX_CALENDARS_PER_FREE_USER || hasLinks;
        })();

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

        await new Promise<void>((resolve, reject) => {
            createModal(<HighlightPlanDowngradeModal user={user} plans={plans} onConfirm={resolve} onClose={reject} />);
        });

        if (await calendarPromise) {
            await new Promise<void>((resolve, reject) => {
                createModal(<CalendarDowngradeModal onConfirm={reject} onClose={reject} />);
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

        await new Promise<void>((resolve, reject) => {
            createModal(<DowngradeModal user={user} onConfirm={resolve} onClose={reject} />);
        });

        const data = await new Promise<FeedbackDowngradeData>((resolve, reject) => {
            createModal(<FeedbackDowngradeModal user={user} onSubmit={resolve} onClose={reject} />);
        });

        return handleUnsubscribe(data);
    };

    return (
        <Button disabled={loading} className={className} onClick={() => withLoading(handleClick())} {...rest}>
            {children}
        </Button>
    );
};

export default UnsubscribeButton;
