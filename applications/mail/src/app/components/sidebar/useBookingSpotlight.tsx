import { differenceInDays, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import useSpotlightShow from '@proton/components/components/spotlight/useSpotlightShow';
import useSpotlightOnFeature from '@proton/components/hooks/useSpotlightOnFeature';
import { CalendarLogo } from '@proton/components/index';
import { FeatureCode } from '@proton/features/interface';
import { MEET_APP_NAME } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

export const BookingPageLocationSpotlightContent = () => {
    return (
        <>
            <div className="flex flex-nowrap items-start mb-1 gap-4">
                <div className="shrink-0">
                    <CalendarLogo variant="glyph-only" />
                </div>
                <div className="flex flex-column flex-nowrap items-start">
                    <p className="text-lg text-bold m-0 mb-1">{c('Title').t`Proton Meet & booking pages`}</p>
                    <p className="m-0">{c('Label')
                        .t`Schedule secure video calls and share your availability with Calendar’s new booking pages and ${MEET_APP_NAME} integration.`}</p>
                </div>
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
