import { useGetAddressKeys } from '@proton/components';
import { toApiNotifications } from '@proton/shared/lib/calendar/veventHelper';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import { getPrimaryKey } from '@proton/shared/lib/keys';

interface UpdatePersonalEventPayloadArguments {
    eventComponent?: VcalVeventComponent;
    hasDefaultNotifications?: boolean;
    addressID?: string;
    memberID: string;
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
}
const getUpdatePersonalEventPayload = async ({
    eventComponent,
    hasDefaultNotifications,
    memberID,
    getAddressKeys,
    addressID,
}: UpdatePersonalEventPayloadArguments) => {
    if (!eventComponent) {
        // we are dropping alarms
        return {
            MemberID: memberID,
            Notifications: [],
        };
    }

    const primaryKey = addressID ? getPrimaryKey(await getAddressKeys(addressID)) : undefined;

    if (!primaryKey) {
        throw new Error('Cannot sign without primary key');
    }

    return {
        MemberID: memberID,
        Notifications: hasDefaultNotifications ? null : toApiNotifications(eventComponent.components),
    };
};

export default getUpdatePersonalEventPayload;
