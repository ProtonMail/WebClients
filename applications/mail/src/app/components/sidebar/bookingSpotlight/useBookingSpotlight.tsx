import { differenceInDays, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import NewBadge from '@proton/components/components/newBadge/NewBadge';
import useSpotlightShow from '@proton/components/components/spotlight/useSpotlightShow';
import useSpotlightOnFeature from '@proton/components/hooks/useSpotlightOnFeature';
import { FeatureCode } from '@proton/features/interface';
import { CALENDAR_APP_NAME, MEET_APP_NAME } from '@proton/shared/lib/constants';
import spotlightImg from '@proton/styles/assets/img/calendar-booking/meet-booking-icon.svg';
import { useFlag } from '@proton/unleash/useFlag';

import './bookingSpotlight.scss';

export const BookingPageLocationSpotlightContent = () => {
    return (
        <>
            <div className="flex flex-nowrap items-start mb-1 gap-4">
                <div className="shrink-0 relative">
                    <span className="absolute spotlight-new-badge">
                        <NewBadge />
                    </span>
                    <img alt="" src={spotlightImg} className="w-custom" style={{ '--w-custom': '3.75rem' }} />
                </div>
                <p className="m-0">{c('Label')
                    .t`Share your availability with booking pages in ${CALENDAR_APP_NAME}, and host secure meetings with ${MEET_APP_NAME}.`}</p>
            </div>
        </>
    );
};

export const useBookingPageSpotlight = () => {
    const {
        welcomeFlags: { isWelcomeFlow },
    } = useWelcomeFlags();

    const [user] = useUser();
    const accountAge = differenceInDays(new Date(), fromUnixTime(user.CreateTime));

    const isBookingsEnabled = useFlag('CalendarBookings');

    const { show, onDisplayed, onClose } = useSpotlightOnFeature(
        FeatureCode.BookingSpotlightInMail,
        !isWelcomeFlow && isBookingsEnabled && accountAge > 3
    );

    const shouldShowSpotlight = useSpotlightShow(show);

    return {
        shouldShowSpotlight,
        onDisplayed,
        onClose,
    };
};
