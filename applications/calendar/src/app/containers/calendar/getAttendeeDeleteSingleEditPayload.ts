import type { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { CALENDAR_CARD_TYPE } from '@proton/shared/lib/calendar/constants';
import { signPart } from '@proton/shared/lib/calendar/crypto/encrypt';
import { getCalendarSignedPartWithExdate } from '@proton/shared/lib/calendar/veventHelper';
import type { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import { getPrimaryKey } from '@proton/shared/lib/keys';

interface AttendeeDeleteSingleEditPayloadArguments {
    eventComponent: VcalVeventComponent;
    addressID?: string;
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
}
const getAttendeeDeleteSingleEditPayload = async ({
    eventComponent,
    getAddressKeys,
    addressID,
}: AttendeeDeleteSingleEditPayloadArguments) => {
    const primaryKey = addressID ? getPrimaryKey(await getAddressKeys(addressID)) : undefined;

    if (!primaryKey) {
        throw new Error('Cannot sign without primary key');
    }

    const { data, signature } = await signPart(getCalendarSignedPartWithExdate(eventComponent), primaryKey.privateKey);

    return {
        CalendarEventContent: [
            {
                Type: CALENDAR_CARD_TYPE.SIGNED,
                Data: data,
                Signature: signature,
            },
        ],
    };
};

export default getAttendeeDeleteSingleEditPayload;
