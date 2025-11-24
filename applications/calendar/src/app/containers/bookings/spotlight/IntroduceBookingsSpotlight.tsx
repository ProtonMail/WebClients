import { c } from 'ttag';

import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import useSpotlightShow from '@proton/components/components/spotlight/useSpotlightShow';
import useSpotlightOnFeature from '@proton/components/hooks/useSpotlightOnFeature';
import { FeatureCode } from '@proton/features/interface';
import spotlightImg from '@proton/styles/assets/img/calendar-booking/spotlight-icon.svg';

import { useBookingsAvailability } from '../useBookingsAvailability';

export const IntroduceBookingsSpotlightContent = () => {
    return (
        <>
            <div className="flex flex-nowrap items-start mb-1 gap-4">
                <div className="shrink-0">
                    <img alt="" src={spotlightImg} className="w-custom" style={{ '--w-custom': '2.75rem' }} />
                </div>
                <div className="flex flex-column flex-nowrap items-start">
                    <p className="text-lg text-bold m-0 mb-1">{c('Title').t`Introducing booking pages`}</p>
                    <p className="m-0">{c('Label').t`Create shareable pages where people can book time with you.`}</p>
                </div>
            </div>
        </>
    );
};

export const useIntroduceBookingsSpotlight = () => {
    const {
        welcomeFlags: { isWelcomeFlow },
    } = useWelcomeFlags();

    const bookingsAvailability = useBookingsAvailability();

    const { show, onDisplayed, onClose } = useSpotlightOnFeature(
        FeatureCode.SpotlightIntroduceBookings,
        !isWelcomeFlow && bookingsAvailability
    );

    const shouldShowSpotlight = useSpotlightShow(show);

    return {
        shouldShowSpotlight,
        onDisplayed,
        onClose,
    };
};
