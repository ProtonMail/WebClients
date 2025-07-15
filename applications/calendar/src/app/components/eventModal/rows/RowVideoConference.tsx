import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import { ZoomRow } from '@proton/calendar';
import { Spotlight } from '@proton/components';
import type { EventModel } from '@proton/shared/lib/interfaces/calendar';
import { useFlag } from '@proton/unleash';

import useVideoConferenceSpotlight from '../../../hooks/useVideoConferenceSpotlight';

interface Props {
    model: EventModel;
    isCreateEvent: boolean;
    setModel: (value: EventModel) => void;
    hasZoomError: boolean;
}

export const RowVideoConference = ({ model, setModel, isCreateEvent, hasZoomError }: Props) => {
    const [user] = useUser();
    const [organization] = useOrganization();
    const isZoomIntegrationEnabled = useFlag('ZoomIntegration');
    const isSettingEnabled = organization?.Settings.VideoConferencingEnabled;
    const hasFullZoomAccess = user.hasPaidMail && isSettingEnabled;
    const hasLimitedZoomAccess = user.hasPaidMail && !isSettingEnabled;
    const hasAccessToZoomIntegration =
        isZoomIntegrationEnabled &&
        // We want to upsell free Mail users or only display the feature for mail subscribers
        (!user.hasPaidMail || hasFullZoomAccess || hasLimitedZoomAccess);

    const { spotlightContent, shouldShowSotlight, onDisplayed, onClose } = useVideoConferenceSpotlight({
        isEventCreation: isCreateEvent,
    });

    if (!hasAccessToZoomIntegration) {
        return null;
    }

    const getAccessLevel = () => {
        if (!user.hasPaidMail) {
            return 'show-upsell';
        }
        return hasFullZoomAccess ? 'full-access' : 'limited-access';
    };

    return (
        <Spotlight
            content={spotlightContent}
            className="ml-2"
            show={shouldShowSotlight}
            onDisplayed={onDisplayed}
            originalPlacement="left"
            onClose={onClose}
        >
            <div>
                <ZoomRow
                    model={model}
                    setModel={setModel}
                    accessLevel={getAccessLevel()}
                    onRowClick={() => onClose()}
                    hasZoomError={hasZoomError}
                />
            </div>
        </Spotlight>
    );
};
