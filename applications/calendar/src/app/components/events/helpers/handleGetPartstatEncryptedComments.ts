import { getEncryptedRSVPComment } from '@proton/shared/lib/calendar/crypto/helpers';
import { getSharedSessionKey } from '@proton/shared/lib/calendar/crypto/keys/helpers';
import type { PartstatData } from '@proton/shared/lib/interfaces/calendar';
import type { GetAddressKeys } from '@proton/shared/lib/interfaces/hooks/GetAddressKeys';
import type { GetCalendarKeys } from '@proton/shared/lib/interfaces/hooks/GetCalendarKeys';

import { getIsCalendarEvent } from '../../../containers/calendar/eventStore/cache/helper';
import type { CalendarViewEventData } from '../../../containers/calendar/interface';

interface Props {
    getAddressKeys: GetAddressKeys;
    getCalendarKeys: GetCalendarKeys;
    partstatData: PartstatData;
    save: boolean;
    selfAddressID: string | undefined;
    targetEventData: CalendarViewEventData['eventData'];
}

export const handleGetPartStatEncryptedComment = async ({
    getAddressKeys,
    getCalendarKeys,
    partstatData,
    save,
    selfAddressID,
    targetEventData,
}: Props) => {
    // Encrypt comment if provided
    let comment, commentClearText;

    // Encrypt comment if:
    // - action is "save"
    // - and comment is present in the action payload
    // - and event already exists
    // - and attendee has an address ID
    if (save && partstatData.Comment && targetEventData && getIsCalendarEvent(targetEventData) && selfAddressID) {
        // Get events keypackets
        const sessionKey = await getSharedSessionKey({
            calendarEvent: targetEventData,
            getAddressKeys,
            getCalendarKeys,
        });

        // Get author primary key
        const [commentAuthorPrimaryKey] = await getAddressKeys(selfAddressID);

        // Encrypt comment
        comment = await getEncryptedRSVPComment({
            authorPrivateKey: commentAuthorPrimaryKey.privateKey,
            comment: partstatData.Comment,
            sessionKey,
            eventUID: targetEventData.UID,
        });

        commentClearText = partstatData.Comment;
    }

    return { comment, commentClearText };
};
