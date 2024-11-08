import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import { ZoomRow } from '@proton/calendar';
import type { EventModel } from '@proton/shared/lib/interfaces/calendar';
import { useFlag } from '@proton/unleash';

interface Props {
    model: EventModel;
    setModel: (value: EventModel) => void;
}

export const RowVideoConference = ({ model, setModel }: Props) => {
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

    if (!hasAccessToZoomIntegration) {
        return null;
    }

    const getAccessLevel = () => {
        if (!user.hasPaidMail) {
            return 'show-upsell';
        }
        return hasFullZoomAccess ? 'full-access' : 'limited-access';
    };

    return <ZoomRow model={model} setModel={setModel} accessLevel={getAccessLevel()} />;
};
