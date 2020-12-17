import { concatArrays } from 'pmcrypto';
import { MIME_TYPES } from 'proton-shared/lib/constants';
import { uint8ArrayToBase64String } from 'proton-shared/lib/helpers/encoding';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { pick } from 'proton-shared/lib/helpers/object';
import { Recipient } from 'proton-shared/lib/interfaces';
import { SendPreferences } from 'proton-shared/lib/interfaces/mail/crypto';
import { RequireSome, SimpleMap } from 'proton-shared/lib/interfaces/utils';
import { sendMessageDirect } from 'proton-shared/lib/api/messages';
import { splitKeys } from 'proton-shared/lib/keys/keys';
import { MESSAGE_FLAGS } from 'proton-shared/lib/mail/constants';
import getSendPreferences from 'proton-shared/lib/mail/send/getSendPreferences';
import { encryptAttachment } from 'proton-shared/lib/mail/send/attachments';
import { generateTopPackages } from 'proton-shared/lib/mail/send/sendTopPackages';
import { encryptPackages } from 'proton-shared/lib/mail/send/sendEncrypt';
import { attachSubPackages } from 'proton-shared/lib/mail/send/sendSubPackages';
import { useCallback } from 'react';
import { useApi, useGetAddressKeys, useGetEncryptionPreferences, useGetMailSettings } from './index';

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
    const getAddressKeys = useGetAddressKeys();
    const getMailSettings = useGetMailSettings();
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
            const { AutoSaveContacts, Sign } = await getMailSettings();
            // const inputMessage = {
            //     localID: generateUID('reply-invitation'),
            //     plainText: plainTextBody,
            //     publicKeys,
            //     privateKeys,
            //     data: {
            //         AddressID: addressID,
            //         Subject: subject,
            //         Sender: from,
            //         ToList: to,
            //         CCList: [],
            //         BCCList: [],
            //         MIMEType: MIME_TYPES.PLAINTEXT,
            //     },
            // };
            // const { Message: updatedMessageData } = await api<{ Message: Message }>(
            //     // MESSAGE_ACTIONS.NEW = -1, better not to export that constant for the moment
            //     createDraft({
            //         Action: -1,
            //         Message: { ...inputMessage.data, Body },
            //         AttachmentKeyPackets: {},
            //     } as any)
            // );
            const replyAttachment = new File([new Blob([ics])], 'invite.ics', { type: 'text/calendar; method=REPLY' });
            const packets = await encryptAttachment(ics, replyAttachment, false, publicKeys, privateKeys);
            const concatenatedPackets = concatArrays([packets.data, packets.keys, packets.signature].filter(isTruthy));
            // const { Attachment: attachment } = await api(
            //     await uploadAttachment({
            //         Filename: packets.Filename,
            //         MessageID: updatedMessageData.ID,
            //         ContentID: '',
            //         MIMEType: packets.MIMEType,
            //         KeyPackets: new Blob([packets.keys] as any),
            //         DataPacket: new Blob([packets.data] as any),
            //         Signature: packets.signature ? new Blob([packets.signature] as any) : undefined,
            //     })
            // );
            // const message = {
            //     ...inputMessage,
            //     data: { ...updatedMessageData, Attachments: [attachment] },
            // };
            const emails = to.map(({ Address }) => Address);
            const attachment = {
                Filename: packets.Filename,
                MIMEType: packets.MIMEType,
                Contents: uint8ArrayToBase64String(concatenatedPackets),
                ContentID: 'reply-ics',
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
                Attachments: [pick(attachment, ['Filename', 'MIMEType', 'ContentID', 'Contents'])],
                Flags: Sign ? MESSAGE_FLAGS.FLAG_SIGN : undefined,
            };
            const mapSendPrefs: SimpleMap<SendPreferences> = {};
            await Promise.all(
                emails.map(async (email) => {
                    const encryptionPreferences = await getEncryptionPreferences(email);
                    const sendPreferences = getSendPreferences(encryptionPreferences, directMessage);
                    mapSendPrefs[email] = sendPreferences;
                })
            );
            // There are two packages to be generated for the payload.
            // The Packages in the request body, called here top-level packages
            // The Packages inside Packages.addresses, called subpackages here
            let packages = generateTopPackages({
                message: directMessage,
                mapSendPrefs,
                attachmentData,
            });
            packages = await attachSubPackages({
                packages,
                attachments: [attachment],
                emails,
                mapSendPrefs,
            });
            packages = await encryptPackages({
                packages,
                attachments: [attachment],
                publicKeys,
                privateKeys,
                message: directMessage,
            });
            // await api(sendMessage(message.data.ID, { Packages: packages, AutoSaveContacts } as any));
            await api(
                sendMessageDirect({
                    Message: directMessage,
                    AttachmentKeys: uint8ArrayToBase64String(packets.keys),
                    Action: -1,
                    AutoSaveContacts,
                    Packages: Object.values(packages),
                } as any)
            );
        },
        [api, getMailSettings, getAddressKeys, getEncryptionPreferences]
    );
    return send;
};

export default useSendIcs;
