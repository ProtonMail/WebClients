import { c } from 'ttag';

import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import useSpotlightShow from '@proton/components/components/spotlight/useSpotlightShow';
import useSpotlightOnFeature from '@proton/components/hooks/useSpotlightOnFeature';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import spotlightImg from '@proton/styles/assets/img/calendar-booking/spotlight-icon.svg';

import { useBookingsAvailability } from '../useBookingsAvailability';

export const BookingPageLocationSpotlightContent = () => {
    return (
        <>
            <div className="flex flex-nowrap items-start mb-1 gap-4">
                <div className="shrink-0">
                    <img alt="" src={spotlightImg} className="w-custom" style={{ '--w-custom': '2.75rem' }} />
                </div>
                <div className="flex flex-column flex-nowrap items-start">
                    <p className="text-lg text-bold m-0 mb-1">{c('Title').t`Your booking pages live here`}</p>
                    <p className="m-0">{c('Label').t`Copy the link or manage your page from here anytime.`}</p>
                </div>
            </div>
        </>
    );
};

export const useBookingPageLocationSpotlight = () => {
    const {
        welcomeFlags: { isWelcomeFlow },
    } = useWelcomeFlags();

    const bookingsAvailability = useBookingsAvailability();
    const { feature } = useFeature(FeatureCode.SpotlightIntroduceBookings);

    const { show, onDisplayed, onClose } = useSpotlightOnFeature(
        FeatureCode.BookingPageLocationSpotlight,
        !isWelcomeFlow && bookingsAvailability && !feature?.Value
    );

    const shouldShowSpotlight = useSpotlightShow(show);

    return {
        shouldShowSpotlight,
        onDisplayed,
        onClose,
    };
};
