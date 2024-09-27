import { useCallback } from 'react';

import { useGetMailSettings } from '@proton/mail/mailSettings/hooks';
import { sendMessageDirect } from '@proton/shared/lib/api/messages';
import { ICAL_METHOD } from '@proton/shared/lib/calendar/constants';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import { pick } from '@proton/shared/lib/helpers/object';
import type { Recipient } from '@proton/shared/lib/interfaces';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import type { SendPreferences } from '@proton/shared/lib/interfaces/mail/crypto';
import { SEND_MESSAGE_DIRECT_ACTION } from '@proton/shared/lib/interfaces/message';
import type { RequireSome, SimpleMap } from '@proton/shared/lib/interfaces/utils';
import { splitKeys } from '@proton/shared/lib/keys/keys';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';
import { AUTO_SAVE_CONTACTS } from '@proton/shared/lib/mail/mailSettings';
import { encryptAttachment } from '@proton/shared/lib/mail/send/attachments';
import generatePackages from '@proton/shared/lib/mail/send/generatePackages';
import getSendPreferences from '@proton/shared/lib/mail/send/getSendPreferences';
import isTruthy from '@proton/utils/isTruthy';
import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

import { useApi, useGetAddressKeys, useGetEncryptionPreferences } from './index';

export interface SendIcsParams {
    method: ICAL_METHOD;
    ics: string;
    from: RequireSome<Recipient, 'Address' | 'Name'>;
    addressID: string;
    parentID?: string;
    to: RequireSome<Recipient, 'Address' | 'Name'>[];
    subject: string;
    plainTextBody?: string;
    sendPreferencesMap?: SimpleMap<SendPreferences>;
    contactEmailsMap?: SimpleMap<ContactEmail>;
}

const useSendIcs = () => {
    const api = useApi();
    const getAddressKeys = useGetAddressKeys();
    const getMailSettings = useGetMailSettings();
    const getEncryptionPreferences = useGetEncryptionPreferences();

    const send = useCallback(
        async ({
            method,
            ics,
            from,
            addressID,
            parentID,
            to,
            subject,
            plainTextBody = '',
            sendPreferencesMap = {},
            contactEmailsMap,
        }: SendIcsParams) => {
            if (!to.length) {
                return;
            }
            if (!addressID) {
                throw new Error('Missing addressID');
            }
            const { publicKeys: allPublicKeys, privateKeys: allPrivateKeys } = splitKeys(
                await getAddressKeys(addressID)
            );
            const [publicKeys, privateKeys] = [allPublicKeys.slice(0, 1), allPrivateKeys.slice(0, 1)];
            const { AutoSaveContacts, Sign } = await getMailSettings();

            const inviteAttachment = new File([new Blob([ics])], 'invite.ics', {
                type: `text/calendar; method=${method}`,
            });
            const packets = await encryptAttachment(ics, inviteAttachment, false, publicKeys, privateKeys);
            const concatenatedPackets = mergeUint8Arrays(
                [packets.data, packets.keys, packets.signature].filter(isTruthy)
            );
            const emails = to.map(({ Address }) => Address);
            const attachment = {
                Filename: packets.Filename,
                MIMEType: packets.MIMEType,
                Contents: uint8ArrayToBase64String(concatenatedPackets),
                KeyPackets: uint8ArrayToBase64String(packets.keys),
                Signature: packets.signature ? uint8ArrayToBase64String(packets.signature) : undefined,
            };
            const attachmentData = {
                attachment,
                data: ics,
            };
            const directMessage = {
                ToList: to,
                CCList: [],
                BCCList: [],
                Subject: subject,
                Sender: from,
                Body: plainTextBody,
                MIMEType: MIME_TYPES.PLAINTEXT,
                Attachments: [pick(attachment, ['Filename', 'MIMEType', 'Contents'])],
                Flags: Sign ? MESSAGE_FLAGS.FLAG_SIGN : undefined,
            };
            const sendPrefsMap: SimpleMap<SendPreferences> = {};
            await Promise.all(
                emails.map(async (email) => {
                    const existingSendPreferences = sendPreferencesMap[email];
                    if (existingSendPreferences) {
                        sendPrefsMap[email] = existingSendPreferences;
                        return;
                    }
                    const encryptionPreferences = await getEncryptionPreferences({
                        email,
                        lifetime: 0,
                        contactEmailsMap,
                    });
                    const sendPreferences = getSendPreferences(encryptionPreferences, directMessage);
                    sendPrefsMap[email] = sendPreferences;
                })
            );
            // throw if trying to send a reply to an organizer with send preferences error
            if (method === ICAL_METHOD.REPLY) {
                const sendPrefError = sendPrefsMap[to[0].Address]?.error;
                if (sendPrefError) {
                    throw sendPrefError;
                }
            }
            const packages = await generatePackages({
                message: directMessage,
                sendPreferencesMap: sendPrefsMap,
                attachmentData,
                attachments: [attachment],
                emails,
                publicKeys,
                privateKeys,
            });
            const payload: any = {
                Message: directMessage,
                AttachmentKeys: uint8ArrayToBase64String(packets.keys),
                // do not save organizer address as contact on REPLY (it could be a calendar group address)
                AutoSaveContacts: method === ICAL_METHOD.REPLY ? AUTO_SAVE_CONTACTS.DISABLED : AutoSaveContacts,
                Packages: Object.values(packages),
            };
            if (parentID) {
                // set the action to tell the API that this is a response to the message with ID = parentID
                payload.ParentID = parentID;
                payload.Action = SEND_MESSAGE_DIRECT_ACTION.REPLY;
            }
            await api({ ...sendMessageDirect(payload), silence: true });
        },
        [api, getMailSettings, getAddressKeys, getEncryptionPreferences]
    );
    return send;
};

export default useSendIcs;
