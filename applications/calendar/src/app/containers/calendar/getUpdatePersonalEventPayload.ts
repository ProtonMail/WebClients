import { toApiNotifications } from '@proton/shared/lib/calendar/veventHelper';
import { Nullable } from '@proton/shared/lib/interfaces';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';

interface UpdatePersonalEventPayloadArguments {
    eventComponent?: VcalVeventComponent;
    hasDefaultNotifications?: boolean;
    color?: Nullable<string>;
}
const getUpdatePersonalEventPayload = async ({
    eventComponent,
    hasDefaultNotifications,
    color,
}: UpdatePersonalEventPayloadArguments) => {
    if (!eventComponent) {
        // we are dropping alarms
        return {
            Notifications: [],
            Color: color ? color : null,
        };
    }

    return {
        Notifications: hasDefaultNotifications ? null : toApiNotifications(eventComponent.components),
        Color: color ? color : null,
    };
};

export default getUpdatePersonalEventPayload;
