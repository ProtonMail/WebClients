import { c } from 'ttag';

import { useWelcomeFlags } from '@proton/account';
import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import useSpotlightShow from '@proton/components/components/spotlight/useSpotlightShow';
import useSpotlightOnFeature from '@proton/components/hooks/useSpotlightOnFeature';
import { FeatureCode } from '@proton/features/interface';
import { isUserAccountOlderThanOrEqualToDays } from '@proton/shared/lib/user/helpers';
import spotlightVideoConfImg from '@proton/styles/assets/img/illustrations/spotlight-video-conference.svg';
import useFlag from '@proton/unleash/useFlag';

interface Props {
    isEventCreation: boolean;
}

const useVideoConferenceSpotlight = ({ isEventCreation }: Props) => {
    const [user] = useUser();
    const [organization] = useOrganization();
    const isZoomIntegrationEnabled = useFlag('ZoomIntegration');
    const {
        welcomeFlags: { isDone: hasUserFinishedWelcomeFlow },
    } = useWelcomeFlags();
    const userAccountHasMoreThanTwoDays = isUserAccountOlderThanOrEqualToDays(user, 2);
    const hasAccessToZoomIntegration =
        isZoomIntegrationEnabled && user.hasPaidMail && organization?.Settings.VideoConferencingEnabled;

    const {
        show: showVideoConferenceSpotlight,
        onDisplayed,
        onClose,
    } = useSpotlightOnFeature(
        FeatureCode.CalendarVideoConferenceSpotlight,
        hasAccessToZoomIntegration && hasUserFinishedWelcomeFlow && userAccountHasMoreThanTwoDays && isEventCreation
    );

    const shouldShowVideoConferenceSpotlight = useSpotlightShow(showVideoConferenceSpotlight);

    const getSpotlightContent = () => {
        return (
            <>
                <div className="flex flex-nowrap items-start mb-1 gap-4">
                    <div className="shrink-0">
                        <img
                            alt=""
                            src={spotlightVideoConfImg}
                            className="w-custom"
                            style={{ '--w-custom': '2.75rem' }}
                        />
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
