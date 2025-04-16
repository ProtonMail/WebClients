import { differenceInDays, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import useSpotlightShow from '@proton/components/components/spotlight/useSpotlightShow';
import useSpotlightOnFeature from '@proton/components/hooks/useSpotlightOnFeature';
import { FeatureCode } from '@proton/features/interface';
import spotlightImg from '@proton/styles/assets/img/illustrations/spotlight-stars.svg';
import useFlag from '@proton/unleash/useFlag';

const today = new Date();

export const RSVPSpotlightContent = () => {
    return (
        <>
            <div className="flex flex-nowrap items-start mb-1 gap-4">
                <div className="shrink-0">
                    <img alt="" src={spotlightImg} className="w-custom" style={{ '--w-custom': '2.75rem' }} />
                </div>
                <div className="flex flex-column flex-nowrap items-start">
                    <p className="text-lg text-bold m-0 mb-1">{c('Title').t`Reply with a note`}</p>
                    <p className="m-0">{c('Label')
                        .t`Let others know if you have a conflict, will be late, or can’t wait for the event.`}</p>
                </div>
            </div>
        </>
    );
};

export const useRSVPSpotlight = () => {
    const [user] = useUser();
    const {
        welcomeFlags: { isWelcomeFlow },
    } = useWelcomeFlags();
    const isFeatureActive = useFlag('RsvpCommentWeb');

    const { show, onDisplayed, onClose } = useSpotlightOnFeature(
        FeatureCode.CalendarRsvpNoteSpotlight,
        // Accounts that are more than two days old
        differenceInDays(today, fromUnixTime(user.CreateTime)) >= 2 && !isWelcomeFlow && isFeatureActive
    );

    const shouldShowSpotlight = useSpotlightShow(show);

    return {
        shouldShowSpotlight,
        onDisplayed,
        onClose,
    };
};
