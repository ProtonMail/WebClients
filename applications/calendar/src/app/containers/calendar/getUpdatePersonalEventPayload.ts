import { useGetAddressKeys } from '@proton/components';
import { toApiNotifications } from '@proton/shared/lib/calendar/veventHelper';
import { Nullable } from '@proton/shared/lib/interfaces';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import { getPrimaryKey } from '@proton/shared/lib/keys';

interface UpdatePersonalEventPayloadArguments {
    eventComponent?: VcalVeventComponent;
    hasDefaultNotifications?: boolean;
    addressID?: string;
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
    color?: Nullable<string>;
}
const getUpdatePersonalEventPayload = async ({
    eventComponent,
    hasDefaultNotifications,
    getAddressKeys,
    addressID,
    color,
}: UpdatePersonalEventPayloadArguments) => {
    if (!eventComponent) {
        // we are dropping alarms
        return {
            Notifications: [],
            Color: color ? color : null,
        };
    }

    const primaryKey = addressID ? getPrimaryKey(await getAddressKeys(addressID)) : undefined;

    if (!primaryKey) {
        throw new Error('Cannot sign without primary key');
    }

    return {
        Notifications: hasDefaultNotifications ? null : toApiNotifications(eventComponent.components),
        Color: color ? color : null,
    };
};

export default getUpdatePersonalEventPayload;
