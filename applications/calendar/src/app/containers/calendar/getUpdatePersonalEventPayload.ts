import { createPersonalEvent } from '@proton/shared/lib/calendar/serialize';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import { getPrimaryKey } from '@proton/shared/lib/keys';
import { useGetAddressKeys } from '@proton/components';

interface UpdatePersonalEventPayloadArguments {
    eventComponent?: VcalVeventComponent;
    addressID?: string;
    memberID: string;
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
}
const getUpdatePersonalEventPayload = async ({
    eventComponent,
    memberID,
    getAddressKeys,
    addressID,
}: UpdatePersonalEventPayloadArguments) => {
    if (!eventComponent) {
        return { MemberID: memberID };
    }
    const primaryKey = addressID ? getPrimaryKey(await getAddressKeys(addressID)) : undefined;
    if (!primaryKey) {
        throw new Error('Cannot sign without primary key');
    }
    const personalData = await createPersonalEvent({ eventComponent, signingKey: primaryKey.privateKey });
    return {
        MemberID: memberID,
        PersonalEventContent: personalData,
    };
};

export default getUpdatePersonalEventPayload;
