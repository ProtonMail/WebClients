import { c } from 'ttag';

import { useWelcomeFlags } from '@proton/account';
import { useUser } from '@proton/account/user/hooks';
import Logo from '@proton/components/components/logo/Logo';
import useSpotlightShow from '@proton/components/components/spotlight/useSpotlightShow';
import useSpotlightOnFeature from '@proton/components/hooks/useSpotlightOnFeature';
import { FeatureCode } from '@proton/features/interface';
import { APPS, MEET_APP_NAME } from '@proton/shared/lib/constants';
import { isUserAccountOlderThanOrEqualToDays } from '@proton/shared/lib/user/helpers';
import useFlag from '@proton/unleash/useFlag';

export const useProtonMeetSpotlight = () => {
    const [user] = useUser();
    const isMeetVideoConferenceEnabled = useFlag('NewScheduleOption');
    const {
        welcomeFlags: { isDone: hasUserFinishedWelcomeFlow },
    } = useWelcomeFlags();

    const userAccountHasMoreThanTwoDays = isUserAccountOlderThanOrEqualToDays(user, 2);

    const {
        show: showProtonMeetSpotlight,
        onDisplayed,
        onClose,
    } = useSpotlightOnFeature(
        FeatureCode.NewScheduleOptionSpotlight,
        isMeetVideoConferenceEnabled && hasUserFinishedWelcomeFlow && userAccountHasMoreThanTwoDays
    );

    const shouldShowProtonMeetSpotlight = useSpotlightShow(showProtonMeetSpotlight, 3000);

    const getSpotlightContent = () => {
        return (
            <>
                <div className="flex flex-nowrap items-start mb-1 gap-4">
                    <div className="shrink-0 relative top-custom" style={{ '--top-custom': '-0.25rem' }}>
                        <Logo
                            className="shrink-0 w-custom"
                            style={{ '--w-custom': '2.75rem' }}
                            appName={APPS.PROTONMEET}
                            variant="glyph-only"
                            size={9}
                        />
                    </div>
                    <div
                        className="flex flex-column flex-nowrap items-start w-custom"
                        style={{ '--w-custom': '15rem' }}
                    >
                        <p className="text-lg text-bold m-0 mb-1">{c('Spotlight').t`${MEET_APP_NAME} is here!`}</p>
                        <p className="m-0 w-custom" style={{ '--w-custom': '15rem' }}>{c('Spotlight')
                            .t`Schedule and join ${MEET_APP_NAME} calls right from your calendar.`}</p>
                    </div>
                </div>
            </>
        );
    };

    return {
        spotlightContent: getSpotlightContent(),
        shouldShowSpotlight: shouldShowProtonMeetSpotlight,
        onDisplayed,
        onClose,
    };
};
