import { serverTime } from '@proton/crypto';
import { acceptInvitation, rejectInvitation } from '@proton/shared/lib/api/calendars';
import { SECOND } from '@proton/shared/lib/constants';
import { Api } from '@proton/shared/lib/interfaces';
import { CalendarMemberInvitation, MEMBER_INVITATION_STATUS } from '@proton/shared/lib/interfaces/calendar';
import { GetAddressKeys } from '@proton/shared/lib/interfaces/hooks/GetAddressKeys';
import { getPrimaryKey } from '@proton/shared/lib/keys';
import { decryptPassphrase, signPassphrase } from '@proton/shared/lib/keys/calendarKeys';

export const getIsInvitationExpired = ({ ExpirationTime }: CalendarMemberInvitation) => {
    if (!ExpirationTime) {
        return false;
    }
    return +serverTime() >= ExpirationTime * SECOND;
};

export const getPendingInvitations = (invitations: CalendarMemberInvitation[]) => {
    return invitations.filter(({ Status }) => Status === MEMBER_INVITATION_STATUS.PENDING);
};

export const filterOutAcceptedInvitations = (invitations: CalendarMemberInvitation[]) => {
    return invitations.filter(({ Status }) => Status !== MEMBER_INVITATION_STATUS.ACCEPTED);
};

export const filterOutExpiredInvitations = (invitations: CalendarMemberInvitation[]) => {
    return invitations.filter((invitation) => !getIsInvitationExpired(invitation));
};

export const acceptCalendarShareInvitation = async ({
    addressID,
    calendarID,
    getAddressKeys,
    armoredPassphrase,
    api,
}: {
    addressID: string;
    calendarID: string;
    armoredPassphrase: string;
    getAddressKeys: GetAddressKeys;
    api: Api;
}) => {
    // TODO: signature verification?
    const addressKeys = await getAddressKeys(addressID);
    const privateKeys = addressKeys.map(({ privateKey }) => privateKey);
    const passphrase = await decryptPassphrase({
        armoredPassphrase,
        privateKeys,
    });
    const { privateKey } = getPrimaryKey(addressKeys) || {};
    if (!privateKey) {
        throw new Error('No primary address key');
    }
    const Signature = await signPassphrase({ passphrase, privateKey });
    return api(acceptInvitation(calendarID, addressID, { Signature }));
};

export const rejectCalendarShareInvitation = ({
    addressID,
    calendarID,
    api,
}: {
    addressID: string;
    calendarID: string;
    api: Api;
}) => {
    return api(rejectInvitation(calendarID, addressID));
};
