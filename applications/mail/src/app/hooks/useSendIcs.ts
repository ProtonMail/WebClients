import { Recipient } from 'proton-shared/lib/interfaces';
import { useRef, useCallback } from 'react';
import {
    generateUID,
    useApi,
    useConfig,
    useGetAddressKeys,
    useGetEncryptionPreferences,
    useUserSettings
} from 'react-components';
import { createDraft, sendMessage } from 'proton-shared/lib/api/messages';
import { splitKeys } from 'proton-shared/lib/keys/keys';
import { uploadAttachment } from '../api/attachments';
import { MESSAGE_ACTIONS } from '../constants';
import { useAttachmentCache } from '../containers/AttachmentProvider';
import { encryptAttachment } from '../helpers/attachment/attachmentUploader';
import getSendPreferences from '../helpers/message/getSendPreferences';
import { prepareAndEncryptBody } from '../helpers/message/messageExport';
import { encryptPackages } from '../helpers/send/sendEncrypt';
import { attachSubPackages } from '../helpers/send/sendSubPackages';
import { generateTopPackages } from '../helpers/send/sendTopPackages';
import { RequestParams } from '../helpers/upload';
import { MapSendPreferences } from '../models/crypto';
import { MessageExtendedWithData, PartialMessageExtended } from '../models/message';
import { RequireSome } from '../models/utils';

interface Params {
    ics: string;
    from: RequireSome<Recipient, 'Address' | 'Name'>;
    addressID: string;
    to: RequireSome<Recipient, 'Address' | 'Name'>[];
    subject: string;
}

export const useSendIcs = () => {
    const api = useApi();
    const config = useConfig();
    const [userSettings] = useUserSettings();
    const getAddressKeys = useGetAddressKeys();
    const getEncryptionPreferences = useGetEncryptionPreferences();
    const attachmentCache = useAttachmentCache();

    const ref = useRef<string>();

    const send = useCallback(
        async ({ ics, from, addressID, to, subject }: Params) => {
            if (!ref.current) {
                ref.current === generateUID('reply-invitation');
            }
            if (!addressID) {
                throw new Error('Missing addressID');
            }
            const { publicKeys: allPublicKeys, privateKeys: allPrivateKeys } = splitKeys(
                await getAddressKeys(addressID)
            );
            const [publicKeys, privateKeys] = [allPublicKeys.slice(0, 1), allPrivateKeys.slice(0, 1)];
            const inputMessage: PartialMessageExtended = {
                localID: generateUID('reply-invitation'),
                plainText: '',
                publicKeys,
                privateKeys,
                data: {
                    AddressID: addressID,
                    Subject: subject,
                    Sender: from,
                    ToList: to,
                    CCList: [],
                    BCCList: []
                }
            };
            const message = inputMessage as MessageExtendedWithData;
            const { encrypted: Body } = await prepareAndEncryptBody(message);
            const { Message: updatedMessageData } = await api(
                createDraft({
                    Action: MESSAGE_ACTIONS.NEW,
                    Message: { ...message.data, Body },
                    AttachmentKeyPackets: {}
                } as any)
            );
            const replyAttachment = new File([new Blob([ics])], 'invite.ics', { type: 'text/calendar; method=REPLY' });
            const packets = await encryptAttachment(ics, replyAttachment, false, publicKeys, privateKeys);

            const { Attachment } = await api(
                (await uploadAttachment({
                    Filename: packets.Filename,
                    MessageID: updatedMessageData.ID,
                    ContentID: '',
                    MIMEType: packets.MIMEType,
                    KeyPackets: new Blob([packets.keys] as any),
                    DataPacket: new Blob([packets.data] as any),
                    Signature: packets.signature ? new Blob([packets.signature] as any) : undefined
                })) as RequestParams
            );
            message.data = { ...updatedMessageData, Attachments: [Attachment] };
            const emails = to.map(({ Address }) => Address);
            const mapSendPrefs: MapSendPreferences = {};
            await Promise.all(
                emails.map(async (email) => {
                    const encryptionPreferences = await getEncryptionPreferences(email);
                    const sendPreferences = getSendPreferences(encryptionPreferences);
                    mapSendPrefs[email] = sendPreferences;
                })
            );
            let packages = await generateTopPackages(message, mapSendPrefs, attachmentCache, api);
            packages = await attachSubPackages(packages, message, emails, mapSendPrefs, api);
            packages = await encryptPackages(message, packages, getAddressKeys);
            await api(sendMessage(message.data.ID, { Packages: packages, AutoSaveContacts: 0 } as any));
        },
        [config, userSettings]
    );
    return send;
};

export default useSendIcs;
