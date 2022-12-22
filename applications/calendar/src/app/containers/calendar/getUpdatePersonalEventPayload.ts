import { useGetAddressKeys } from '@proton/components';
import { createPersonalEvent } from '@proton/shared/lib/calendar/serialize';
import { toApiNotifications } from '@proton/shared/lib/calendar/veventHelper';
import { CreateSinglePersonalEventData, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import { getPrimaryKey } from '@proton/shared/lib/keys';

interface UpdatePersonalEventPayloadArguments {
    eventComponent?: VcalVeventComponent;
    hasDefaultNotifications?: boolean;
    personalEventsDeprecated: boolean;
    addressID?: string;
    memberID: string;
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
}
const getUpdatePersonalEventPayload = async ({
    eventComponent,
    hasDefaultNotifications,
    personalEventsDeprecated,
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

    const result: CreateSinglePersonalEventData = {
        MemberID: memberID,
        Notifications: hasDefaultNotifications ? null : toApiNotifications(eventComponent.components),
    };

    if (!personalEventsDeprecated) {
        result.PersonalEventContent = await createPersonalEvent({ eventComponent, signingKey: primaryKey.privateKey });
    }

    return result;
};

export default getUpdatePersonalEventPayload;
