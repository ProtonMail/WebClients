import { c } from 'ttag';

import { CryptoProxy, VERIFICATION_STATUS, serverTime } from '@proton/crypto';
import { getSignatureContext } from '@proton/shared/lib/calendar/crypto/helpers';
import { ShareCalendarSignatureVerificationError } from '@proton/shared/lib/calendar/sharing/shareProton/ShareCalendarSignatureVerificationError';
import type { GetEncryptionPreferences } from '@proton/shared/lib/interfaces/hooks/GetEncryptionPreferences';

import { acceptInvitation, rejectInvitation } from '../../../api/calendars';
import { SECOND } from '../../../constants';
import { getContactDisplayNameEmail } from '../../../contacts/contactEmail';
import { canonicalizeEmail } from '../../../helpers/email';
import type { Api, SimpleMap } from '../../../interfaces';
import type { CalendarMemberInvitation, VisualCalendar } from '../../../interfaces/calendar';
import { MEMBER_INVITATION_STATUS } from '../../../interfaces/calendar';
import type { ContactEmail } from '../../../interfaces/contacts';
import type { GetAddressKeys } from '../../../interfaces/hooks/GetAddressKeys';
import { getPrimaryKey } from '../../../keys';
import { getIsSharedCalendar } from '../../calendar';
import type { CALENDAR_PERMISSIONS } from '../../constants';
import { CALENDAR_TYPE } from '../../constants';
import { decryptPassphrase, decryptPassphraseSessionKey, signPassphrase } from '../../crypto/keys/calendarKeys';
import { getCanWrite } from '../../permissions';

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

export const filterOutDeclinedInvitations = (invitations: CalendarMemberInvitation[]) => {
    return invitations.filter(({ Status }) => Status !== MEMBER_INVITATION_STATUS.REJECTED);
};

export const filterOutExpiredInvitations = (invitations: CalendarMemberInvitation[]) => {
    return invitations.filter((invitation) => !getIsInvitationExpired(invitation));
};

export const acceptCalendarShareInvitation = async ({
    addressID,
    calendarID,
    armoredPassphrase,
    armoredSignature,
    senderEmail,
    getAddressKeys,
    getEncryptionPreferences,
    api,
    skipSignatureVerification,
}: {
    addressID: string;
    calendarID: string;
    armoredPassphrase: string;
    armoredSignature: string;
    senderEmail: string;
    getAddressKeys: GetAddressKeys;
    getEncryptionPreferences: GetEncryptionPreferences;
    api: Api;
    skipSignatureVerification?: boolean;
}): Promise<boolean> => {
    // decrypt passphrase
    const addressKeys = await getAddressKeys(addressID);
    const privateKeys = addressKeys.map(({ privateKey }) => privateKey);
    const passphraseSessionKey = await decryptPassphraseSessionKey({ armoredPassphrase, privateKeys });
    if (!passphraseSessionKey) {
        throw new Error('Missing passphrase session key');
    }

    // verify passphrase signature
    if (!skipSignatureVerification) {
        const { verifyingPinnedKeys } = await getEncryptionPreferences({ email: senderEmail });
        if (verifyingPinnedKeys.length) {
            const { verificationStatus: sessionKeyVerificationStatus, errors } = await CryptoProxy.verifyMessage({
                armoredSignature,
                binaryData: passphraseSessionKey.data,
                verificationKeys: verifyingPinnedKeys,
                signatureContext: { required: true, value: getSignatureContext('calendar.sharing.invite') },
            });
            if (sessionKeyVerificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
                /**
                 * TEMPORARY CODE: needed while there exist old clients not sending signatures with context.
                 * For such clients, the BE gives us a passphrase signature, so we try verifying that
                 *
                 * When not needed anymore, substitute by:
                 * throw new ShareCalendarSignatureVerificationError(senderEmail, errors);
                 */
                const { verificationStatus: passphraseVerificationStatus } = await CryptoProxy.decryptMessage({
                    armoredMessage: armoredPassphrase,
                    armoredSignature,
                    verificationKeys: verifyingPinnedKeys,
                    sessionKeys: passphraseSessionKey,
                });
                if (passphraseVerificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
                    throw new ShareCalendarSignatureVerificationError(senderEmail, errors);
                }
            }
        }
    }

    // accept invitation
    const passphrase = await decryptPassphrase({
        armoredPassphrase,
        sessionKey: passphraseSessionKey,
    });
    const { privateKey } = getPrimaryKey(addressKeys) || {};
    if (!privateKey) {
        throw new Error('No primary address key');
    }
    const Signature = await signPassphrase({ passphrase, privateKey });
    await api(acceptInvitation(calendarID, addressID, { Signature }));
    return true;
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

export const getSharedCalendarSubHeaderText = (calendar: VisualCalendar, contactEmailsMap: SimpleMap<ContactEmail>) => {
    // we only need to display the owner for shared calendars
    if (!getIsSharedCalendar(calendar)) {
        return;
    }

    const { Name: contactName, Email: contactEmail } = contactEmailsMap[canonicalizeEmail(calendar.Owner.Email)] || {};
    const email = contactEmail || calendar.Owner.Email;
    const { nameEmail: ownerName } = getContactDisplayNameEmail({
        name: contactName,
        email,
        emailDelimiters: ['(', ')'],
    });

    return c('Shared calendar; Info about calendar owner').t`Shared by ${ownerName}`;
};

export const getCalendarNameWithOwner = ({
    calendarName,
    ownerEmail,
}: {
    calendarName: string;
    ownerEmail: string;
}) => {
    return `${calendarName} (${ownerEmail})`;
};

export const getCalendarNameSubline = ({
    calendarType,
    displayEmail,
    memberEmail,
    memberPermissions,
}: {
    calendarType: CALENDAR_TYPE;
    displayEmail: boolean;
    memberEmail: string;
    memberPermissions: CALENDAR_PERMISSIONS;
}) => {
    const email = displayEmail ? memberEmail : '';
    const viewOnlyText =
        !getCanWrite(memberPermissions) && calendarType === CALENDAR_TYPE.PERSONAL
            ? c('Info; access rights for shared calendar').t`View only`
            : '';

    if (!email && !viewOnlyText) {
        return '';
    }

    if (!viewOnlyText) {
        return email;
    }

    if (!email) {
        return viewOnlyText;
    }

    return `${viewOnlyText} • ${email}`;
};
