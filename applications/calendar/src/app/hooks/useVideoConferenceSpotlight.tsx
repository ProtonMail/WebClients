import { addDays, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import {
    useActiveBreakpoint,
    useOrganization,
    useSpotlightOnFeature,
    useSpotlightShow,
    useWelcomeFlags,
} from '@proton/components';
import { FeatureCode } from '@proton/features/interface';
import spotlightVideoConfImg from '@proton/styles/assets/img/illustrations/spotlight-video-conference.svg';
import useFlag from '@proton/unleash/useFlag';

const useVideoConferenceSpotlight = () => {
    const [user] = useUser();
    const { viewportWidth } = useActiveBreakpoint();
    const [organization] = useOrganization();
    const isZoomIntegrationEnabled = useFlag('ZoomIntegration');
    const [{ isDone: hasUserFinishedWelcomeFlow }] = useWelcomeFlags();
    const userAccountHasMoreThanTwoDays = new Date() > addDays(fromUnixTime(user.CreateTime), 2);
    const hasAccessToZoomIntegration =
        isZoomIntegrationEnabled && user.hasPaidMail && organization?.Settings.VideoConferencingEnabled;

    const isSmallViewport = viewportWidth['<=small'];

    const {
        show: showVideoConferenceSpotlight,
        onDisplayed,
        onClose,
    } = useSpotlightOnFeature(
        FeatureCode.CalendarVideoConferenceSpotlight,
        hasAccessToZoomIntegration && !isSmallViewport && hasUserFinishedWelcomeFlow && userAccountHasMoreThanTwoDays
    );

    const shouldShowVideoConferenceSpotlight = useSpotlightShow(showVideoConferenceSpotlight, 3000);

    const getSpotlightContent = () => {
        return (
            <>
                <div className="flex flex-nowrap items-start mb-1 gap-4">
                    <div className="shrink-0">
                        <img src={spotlightVideoConfImg} alt="" />
                    </div>
                    <div className="flex flex-column flex-nowrap items-start">
                        <p className="text-lg text-bold m-0 mb-1">{c('Spotlight').t`Video conferencing is here!`}</p>
                        <p className="m-0">{c('Spotlight')
                            .t`Seamlessly create and add video meeting links to your events.`}</p>
                    </div>
                </div>
            </>
        );
    };

    return {
        spotlightContent: getSpotlightContent(),
        shouldShowSotlight: shouldShowVideoConferenceSpotlight,
        onDisplayed,
        onClose,
    };
};

export default useVideoConferenceSpotlight;
