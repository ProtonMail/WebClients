import { useGetAddressKeys } from '@proton/components';
import { toApiNotifications } from '@proton/shared/lib/calendar/veventHelper';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import { getPrimaryKey } from '@proton/shared/lib/keys';

interface UpdatePersonalEventPayloadArguments {
    eventComponent?: VcalVeventComponent;
    hasDefaultNotifications?: boolean;
    addressID?: string;
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
}
const getUpdatePersonalEventPayload = async ({
    eventComponent,
    hasDefaultNotifications,
    getAddressKeys,
    addressID,
}: UpdatePersonalEventPayloadArguments) => {
    if (!eventComponent) {
        // we are dropping alarms
        return {
            Notifications: [],
        };
    }

    const primaryKey = addressID ? getPrimaryKey(await getAddressKeys(addressID)) : undefined;

    if (!primaryKey) {
        throw new Error('Cannot sign without primary key');
    }

    return {
        Notifications: hasDefaultNotifications ? null : toApiNotifications(eventComponent.components),
    };
};

export default getUpdatePersonalEventPayload;
