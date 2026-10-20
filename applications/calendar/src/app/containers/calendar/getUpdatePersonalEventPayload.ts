import { toApiNotifications } from '@proton/shared/lib/calendar/veventHelper';
import type { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';
import type { Nullable } from '@proton/shared/lib/interfaces/utils';

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
