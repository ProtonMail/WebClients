import { enums } from 'openpgp';
import { encryptMessage } from 'pmcrypto';
import { MIME_TYPES } from 'proton-shared/lib/constants';
import { Recipient } from 'proton-shared/lib/interfaces';
import { SendPreferences } from 'proton-shared/lib/interfaces/mail/crypto';
import { Message, SimpleMessageExtended } from 'proton-shared/lib/interfaces/mail/Message';
import { RequireSome, SimpleMap } from 'proton-shared/lib/interfaces/utils';
import { createDraft, sendMessage } from 'proton-shared/lib/api/messages';
import { splitKeys } from 'proton-shared/lib/keys/keys';
import { uploadAttachment } from 'proton-shared/lib/api/attachments';
import getSendPreferences from 'proton-shared/lib/mail/send/getSendPreferences';
import { encryptAttachment } from 'proton-shared/lib/mail/send/attachments';
import { generateTopPackages } from 'proton-shared/lib/mail/send/sendTopPackages';
import { encryptPackages } from 'proton-shared/lib/mail/send/sendEncrypt';
import { attachSubPackages } from 'proton-shared/lib/mail/send/sendSubPackages';
import { useCallback } from 'react';
import { useApi, useGetAddressKeys, useGetEncryptionPreferences, useUserSettings } from './index';
import { generateUID } from '../helpers/component';

interface Params {
    ics: string;
    from: RequireSome<Recipient, 'Address' | 'Name'>;
    addressID: string;
    to: RequireSome<Recipient, 'Address' | 'Name'>[];
    subject: string;
    plainTextBody?: string;
}

export const useSendIcs = () => {
    const api = useApi();
    const [userSettings] = useUserSettings();
    const getAddressKeys = useGetAddressKeys();
    const getEncryptionPreferences = useGetEncryptionPreferences();

    const send = useCallback(
        async ({ ics, from, addressID, to, subject, plainTextBody = '' }: Params) => {
            if (!addressID) {
                throw new Error('Missing addressID');
            }
            const { publicKeys: allPublicKeys, privateKeys: allPrivateKeys } = splitKeys(
                await getAddressKeys(addressID)
            );
            const [publicKeys, privateKeys] = [allPublicKeys.slice(0, 1), allPrivateKeys.slice(0, 1)];
            const inputMessage: SimpleMessageExtended = {
                localID: generateUID('reply-invitation'),
                plainText: plainTextBody,
                publicKeys,
                privateKeys,
                data: {
                    AddressID: addressID,
                    Subject: subject,
                    Sender: from,
                    ToList: to,
                    CCList: [],
                    BCCList: [],
                    MIMEType: MIME_TYPES.PLAINTEXT,
                },
            };
            const { data: Body } = await encryptMessage({
                data: inputMessage.plainText,
                publicKeys: [publicKeys?.[0]],
                privateKeys: [privateKeys?.[0]],
                compression: enums.compression.zip,
            });
            const { Message: updatedMessageData } = await api<{ Message: Message }>(
                // MESSAGE_ACTIONS.NEW = -1, better not to export that constant for the moment
                createDraft({
                    Action: -1,
                    Message: { ...inputMessage.data, Body },
                    AttachmentKeyPackets: {},
                } as any)
            );
            const replyAttachment = new File([new Blob([ics])], 'invite.ics', { type: 'text/calendar; method=REPLY' });
            const packets = await encryptAttachment(ics, replyAttachment, false, publicKeys, privateKeys);

            const { Attachment: attachment } = await api(
                await uploadAttachment({
                    Filename: packets.Filename,
                    MessageID: updatedMessageData.ID,
                    ContentID: '',
                    MIMEType: packets.MIMEType,
                    KeyPackets: new Blob([packets.keys] as any),
                    DataPacket: new Blob([packets.data] as any),
                    Signature: packets.signature ? new Blob([packets.signature] as any) : undefined,
                })
            );
            const message = {
                ...inputMessage,
                data: { ...updatedMessageData, Attachments: [attachment] },
            };
            const attachmentData = {
                attachment,
                data: ics,
            };
            const emails = to.map(({ Address }) => Address);
            const mapSendPrefs: SimpleMap<SendPreferences> = {};
            await Promise.all(
                emails.map(async (email) => {
                    const encryptionPreferences = await getEncryptionPreferences(email);
                    const sendPreferences = getSendPreferences(encryptionPreferences, message.data);
                    mapSendPrefs[email] = sendPreferences;
                })
            );
            let packages = generateTopPackages(message.data, '', mapSendPrefs, attachmentData);
            packages = await attachSubPackages(packages, message.data, emails, mapSendPrefs, api);
            packages = await encryptPackages(message, packages, getAddressKeys);
            await api(sendMessage(message.data.ID, { Packages: packages, AutoSaveContacts: 0 } as any));
        },
        [api, userSettings, getAddressKeys, getEncryptionPreferences]
    );
    return send;
};

export default useSendIcs;
