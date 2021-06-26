import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { getCalendars } from 'proton-shared/lib/models/calendarsModel';
import { deleteSubscription } from 'proton-shared/lib/api/payments';
import { hasBonuses } from 'proton-shared/lib/helpers/organization';
import { MAX_CALENDARS_PER_FREE_USER } from 'proton-shared/lib/calendar/constants';
import { Calendar, CalendarUrlsResponse } from 'proton-shared/lib/interfaces/calendar';
import { getPublicLinks } from 'proton-shared/lib/api/calendars';
import { getIsPersonalCalendar } from 'proton-shared/lib/calendar/subscribe/helpers';
import { unary } from 'proton-shared/lib/helpers/function';
import Button, { ButtonProps } from '../../../components/button/Button';
import {
    useApi,
    useUser,
    useNotifications,
    useLoading,
    useModals,
    useEventManager,
    useOrganization,
} from '../../../hooks';
import LossLoyaltyModal from '../LossLoyaltyModal';
import DowngradeModal from '../DowngradeModal';
import SubscriptionCancelModal, { SubscriptionCancelModel } from './SubscriptionCancelModal';
import CalendarDowngradeModal from './CalendarDowngradeModal';

interface Props extends Omit<ButtonProps, 'loading' | 'onClick'> {
    children: React.ReactNode;
}

const UnsubscribeButton = ({ className, children, ...rest }: Props) => {
    const [user] = useUser();
    const [organization] = useOrganization();
    const { createNotification, hideNotification } = useNotifications();
    const { createModal } = useModals();
    const api = useApi();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();

    /*
     * subscriptionCancelData is undefined if the user skipped
     * the cancel-subscription-form step
     */
    const handleUnsubscribe = async (subscriptionCancelData: SubscriptionCancelModel | void) => {
        const downgradeNotificationId = createNotification({
            type: 'info',
            text: c('State').t`Downgrading your account, please wait`,
            expiration: 99999,
        });

        try {
            await api(deleteSubscription(subscriptionCancelData));
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

        const calendars: Calendar[] = await getCalendars(api);
        const personalCalendars = calendars.filter(unary(getIsPersonalCalendar));

        const hasLinks = !!(
            await Promise.all(
                personalCalendars.map((calendar) => api<CalendarUrlsResponse>(getPublicLinks(calendar.ID)))
            )
        ).flatMap(({ CalendarUrls }) => CalendarUrls).length;

        if (personalCalendars.length > MAX_CALENDARS_PER_FREE_USER || hasLinks) {
            await new Promise<void>((resolve, reject) => {
                createModal(<CalendarDowngradeModal onSubmit={resolve} onClose={reject} />);
            });
        }

        const subscriptionCancelData = await new Promise<SubscriptionCancelModel | void>((resolve, reject) => {
            createModal(<SubscriptionCancelModal onSubmit={resolve} onSkip={resolve} onClose={reject} />);
        });

        await new Promise<void>((resolve, reject) => {
            createModal(<DowngradeModal user={user} onConfirm={resolve} onClose={reject} />);
        });

        if (hasBonuses(organization)) {
            await new Promise<void>((resolve, reject) => {
                createModal(<LossLoyaltyModal organization={organization} onConfirm={resolve} onClose={reject} />);
            });
        }

        return handleUnsubscribe(subscriptionCancelData);
    };

    return (
        <Button disabled={loading} className={className} onClick={() => withLoading(handleClick())} {...rest}>
            {children}
        </Button>
    );
};

UnsubscribeButton.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node.isRequired,
};

export default UnsubscribeButton;
