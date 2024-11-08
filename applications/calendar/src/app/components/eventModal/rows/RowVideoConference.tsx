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
    const hasAccessToZoomIntegration =
        isZoomIntegrationEnabled &&
        // We want to upsell free Mail users or only display the feature for mail subscribers
        (!user.hasPaidMail || (user.hasPaidMail && organization?.Settings.VideoConferencingEnabled));

    if (!hasAccessToZoomIntegration) {
        return null;
    }

    return <ZoomRow model={model} setModel={setModel} />;
};
