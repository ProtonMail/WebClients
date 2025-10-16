// noinspection ExceptionCaughtLocallyJS
import { decode as msgpackDecode, encode as msgpackEncode } from '@msgpack/msgpack';
import stableStringify from 'json-stable-stringify';
import isNil from 'lodash/isNil';
import isObject from 'lodash/isObject';

import { base64StringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import { generateAndImportKey } from '@proton/crypto/lib/subtle/aesGcm';

import {
    base64ToSpaceKey,
    cryptoKeyToBase64,
    decryptString,
    decryptUint8Array,
    encryptString,
    encryptUint8Array,
    unwrapAesKey,
    wrapAesKey,
} from './crypto';
import type { AesGcmCryptoKey, AesKwCryptoKey } from './crypto/types';
import { safeLogger } from './util/safeLogger';
import type { LumoUserSettings } from './redux/slices/lumoUserSettings';
import type { SerializedUserSettings, UserSettingsToApi } from './remote/types';
import {
    type AdString,
    type Attachment,
    type AttachmentPub,
    type Conversation,
    type ConversationPub,
    type EncryptedData,
    type Message,
    type MessagePriv,
    type MessagePub,
    type SerializedAttachment,
    type SerializedConversation,
    type SerializedMessage,
    type SerializedSpace,
    type Space,
    type SpaceKeyClear,
    type SpaceKeyEnc,
    type SpacePub,
    getAttachmentPub,
    getConversationPub,
    getMessagePriv,
    getMessagePub,
    getSpaceDek,
    getSpacePub,
    isAttachmentPriv,
    isConversationPriv,
    isEmptyMessagePriv,
    isMessagePriv,
    isSpacePriv,
    splitAttachment,
    splitConversation,
    splitSpace,
} from './types';
import { objectMapV } from './util/objects';

const APP_NAME = 'lumo';

// Warning: It is critical to always get the same AD for the same space.
// This has consequences in terms of backward compatibility: if you
// change this logic, this might make older spaces unreadable,
// because the AD won't match anymore during decryption.
function getSpaceAd(space: SpacePub): AdString {
    const { id } = space;

    const _adString = stableStringify({
        app: APP_NAME,
        type: 'space',
        id,
    });
    if (!_adString) throw new Error('Could not get AD for space');
    return _adString;
}

// Warning: It is critical to always get the same AD for the same conversation.
// This has consequences in terms of backward compatibility: if you
// change this logic, this might make older conversations unreadable,
// because the AD won't match anymore during decryption.
function getConversationAd(conversation: ConversationPub): AdString {
    const { id, spaceId } = conversation;
    
    const _adString = stableStringify({
        app: APP_NAME,
        type: 'conversation',
        id,
        spaceId,
    });
    if (!_adString) throw new Error('Could not get AD for conversation');
    return _adString;
}

// Warning: It is critical to always get the same AD for the same message.
// This has consequences in terms of backward compatibility: if you
// change this logic, this might make older messages unreadable,
// because the AD won't match anymore during decryption.
function getMessageAd(message: MessagePub): AdString {
    const { id, role, parentId, conversationId } = message;
    
    const _adString = stableStringify({
        app: APP_NAME,
        type: 'message',
        id,
        role,
        parentId,
        conversationId,
    });
    if (!_adString) throw new Error('Could not get AD for message');
    return _adString;
}

// Warning: It is critical to always get the same AD for the same attachment.
// This has consequences in terms of backward compatibility: if you
// change this logic, this might make older messages unreadable,
// because the AD won't match anymore during decryption.
function getAttachmentAd(attachment: AttachmentPub): AdString {
    const { id } = attachment;
    
    const _adString = stableStringify({
        app: APP_NAME,
        type: 'attachment',
        id,
    });
    if (!_adString) throw new Error('Could not get AD for attachment');
    return _adString;
}

export async function serializeSpace(space: Space, masterKey: AesKwCryptoKey): Promise<SerializedSpace> {
    const { spacePriv, spacePub, spaceKeyClear } = splitSpace(space);

    const spaceKeyBase64 = spaceKeyClear.spaceKey;
    const spaceKey = await base64ToSpaceKey(spaceKeyBase64, true);
    const spaceKeyWrappedBytes = await wrapAesKey(spaceKey, masterKey);
    const spaceKeyWrappedBase64 = uint8ArrayToBase64String(spaceKeyWrappedBytes);
    const spaceKeyEnc: SpaceKeyEnc = { wrappedSpaceKey: spaceKeyWrappedBase64 };

    const spacePrivJson = JSON.stringify(spacePriv);
    const spaceDek = await getSpaceDek(spaceKeyClear);
    const ad = getSpaceAd(space);
    const spacePrivJsonEncrypted = await encryptString(spacePrivJson, spaceDek, ad);

    return {
        ...spacePub,
        ...spaceKeyEnc,
        encrypted: spacePrivJsonEncrypted,
    };
}

export async function deserializeSpace(
    serializedSpace: SerializedSpace,
    masterKey: AesKwCryptoKey
): Promise<Space | null | undefined> {
    try {
        const spacePub = getSpacePub(serializedSpace);
        const { encrypted, deleted } = serializedSpace;

        if (deleted === true) {
            return null;
        }

        const spaceKeyWrappedBase64 = serializedSpace.wrappedSpaceKey;
        if (!spaceKeyWrappedBase64) {
            throw new Error(`Space ${serializedSpace.id} has no wrappedSpaceKey but is not deleted`);
        }

        const spaceKeyWrappedBytes = base64StringToUint8Array(spaceKeyWrappedBase64);
        const spaceKey = await unwrapAesKey(spaceKeyWrappedBytes, masterKey, true);
        const spaceKeyClear: SpaceKeyClear = { spaceKey: await cryptoKeyToBase64(spaceKey.encryptKey) };

        const ad = getSpaceAd(serializedSpace);
        const spaceDek = await getSpaceDek(spaceKeyClear);
        if (!spaceDek) {
            return;
        }
        let spacePriv = {};
        if (encrypted) {
            const spacePrivJson = await decryptString(encrypted, spaceDek, ad);
            spacePriv = JSON.parse(spacePrivJson);
            if (!isSpacePriv(spacePriv)) {
                throw new Error('Deserialized object is not a SpacePriv');
            }
        }
        return {
            ...spacePub,
            ...spaceKeyClear,
            ...spacePriv,
        };
    } catch (e) {
        safeLogger.warn(`Cannot deserialize space ${serializedSpace.id}: `, e);
        return null;
    }
}

export async function serializeConversation(
    conversation: Conversation,
    spaceDek: AesGcmCryptoKey
): Promise<SerializedConversation> {
    const conversationAd = getConversationAd(conversation);
    const { conversationPriv, conversationPub } = splitConversation(conversation);
    const conversationPrivJson = JSON.stringify(conversationPriv);
    const conversationPrivJsonEncrypted = await encryptString(conversationPrivJson, spaceDek, conversationAd);

    return {
        ...conversationPub,
        encrypted: conversationPrivJsonEncrypted,
    };
}

export async function deserializeConversation(
    serializedConversation: SerializedConversation,
    spaceDek: AesGcmCryptoKey
): Promise<Conversation | null> {
    try {
        const conversationPub = getConversationPub(serializedConversation);
        const ad = getConversationAd(serializedConversation);
        const conversationPrivJson = await decryptString(serializedConversation.encrypted, spaceDek, ad);
        const conversationPriv = JSON.parse(conversationPrivJson);
        if (!isConversationPriv(conversationPriv)) {
            throw new Error('Deserialized object is not a ConversationPriv');
        }
        return {
            ...conversationPub,
            ...conversationPriv,
        };
    } catch (e) {
        safeLogger.warn(`Cannot deserialize conversation ${serializedConversation.id}:`, e);
        return null;
    }
}

export async function serializeMessage(message: Message, spaceDek: AesGcmCryptoKey): Promise<SerializedMessage | null> {
    try {
        const ad = getMessageAd(message);
        const { context, ...messagePriv } = getMessagePriv(message);
        const messagePub = getMessagePub(message);
        let encrypted: EncryptedData | undefined = undefined;
        if (!isEmptyMessagePriv(messagePriv)) {
            const messagePrivJson = JSON.stringify(messagePriv);
            const messagePrivJsonEncrypted = await encryptString(messagePrivJson, spaceDek, ad);
            encrypted = messagePrivJsonEncrypted;
        }

        return {
            ...messagePub,
            encrypted,
        };
    } catch (e) {
        safeLogger.warn(`Cannot serialize message ${message.id}:`, e);
        return null;
    }
}

export async function deserializeMessage(
    serializedMessage: SerializedMessage,
    spaceDek: AesGcmCryptoKey
): Promise<Message | null> {
    try {
        const messagePub = getMessagePub(serializedMessage);
        const ad = getMessageAd(serializedMessage);
        const { encrypted } = serializedMessage;
        let messagePriv: MessagePriv = {};
        if (encrypted !== undefined) {
            const messagePrivJson = await decryptString(encrypted, spaceDek, ad);
            messagePriv = JSON.parse(messagePrivJson);
            if (!isMessagePriv(messagePriv)) {
                throw new Error('Deserialized object is not a MessagePriv');
            }
        }
        return {
            ...messagePub,
            ...messagePriv,
        };
    } catch (e) {
        safeLogger.warn(`Cannot deserialize message ${serializedMessage.id}:`, e);
        return null;
    }
}

export async function serializeAttachment(
    attachment: Attachment,
    spaceDek: AesGcmCryptoKey
): Promise<SerializedAttachment | null> {
    try {
        const ad = getAttachmentAd(attachment);
        const { attachmentPriv, attachmentPub } = splitAttachment(attachment);
        const { processing, ...attachmentPubRest } = attachmentPub;

        // We copy some metadata from Pub to Priv, because SQL does not have the columns to store them,
        // so we have to cram it in the encrypted payload.
        const { mimeType, rawBytes } = attachmentPub;
        const privPlus = {
            ...attachmentPriv,
            mimeType,
            rawBytes,
        };

        const packed = msgpackEncode(privPlus) as Uint8Array<ArrayBuffer>;
        const encrypted: EncryptedData = await encryptUint8Array(packed, spaceDek, ad);
        return {
            ...attachmentPubRest,
            encrypted,
        };
    } catch (e) {
        safeLogger.warn(`Cannot serialize attachment ${attachment.id}:`, e);
        return null;
    }
}

export async function deserializeAttachment(
    serializedAttachment: SerializedAttachment,
    spaceDek: AesGcmCryptoKey
): Promise<Attachment | null> {
    try {
        const attachmentPub = getAttachmentPub(serializedAttachment);
        const ad = getAttachmentAd(serializedAttachment);
        const { encrypted } = serializedAttachment;
        if (encrypted === undefined) {
            console.log(`not deserializing ${serializedAttachment.id}: attachment is shallow (has no encrypted data)`);
            return null;
        }
        const packed = await decryptUint8Array(encrypted, spaceDek, ad);
        const decodedWithNulls = msgpackDecode(packed);
        if (!isObject(decodedWithNulls)) {
            throw new Error('Deserialized data is not an object');
        }
        // msgpack can turn undefined into nulls, we revert that
        const decoded = objectMapV(decodedWithNulls, (v) => (v === null ? undefined : v));
        if (!isAttachmentPriv(decoded)) {
            throw new Error('Deserialized object is not an AttachmentPriv');
        }
        // We copy some metadata from priv to pub, because SQL has nowhere to store them.
        // See analogous comment in `serializeAttachment()`.
        const mimeType = (decoded as { mimeType?: unknown }).mimeType;
        const rawBytes = (decoded as { rawBytes?: unknown }).rawBytes;
        return {
            ...attachmentPub,
            ...decoded,
            ...(mimeType && typeof mimeType === 'string' ? { mimeType } : {}),
            ...(!isNil(rawBytes) && typeof rawBytes === 'number' && Number.isInteger(rawBytes) ? { rawBytes } : {}),
        };
    } catch (e) {
        safeLogger.warn(`Cannot deserialize attachment ${serializedAttachment.id}:`, e);
        return null;
    }
}


// User settings serialization functions
// Warning: It is critical to always get the same AD for the same user settings.
// This has consequences in terms of backward compatibility: if you
// change this logic, this might make older user settings unreadable,
// because the AD won't match anymore during decryption.
function getUserSettingsAd(): AdString {
    const _adString = stableStringify({
        app: APP_NAME,
        type: 'user-settings',
    });
    if (!_adString) throw new Error('Could not get AD for user settings');
    return _adString;
}

export async function serializeUserSettings(
    userSettings: LumoUserSettings,
    masterKey: AesKwCryptoKey
): Promise<UserSettingsToApi> {
    // Create a data encryption key for user settings (similar to space DEK)
    const userSettingsDek = await generateAndImportKey();
    

    // Wrap the DEK with the master key
    const wrappedKey = await wrapAesKey(
        { type: 'AesGcmCryptoKey', encryptKey: userSettingsDek },
        masterKey
    );
    const wrappedKeyBase64 = uint8ArrayToBase64String(wrappedKey);

    // Serialize user settings to JSON
    const userSettingsJson = JSON.stringify(userSettings);

    // Encrypt the user settings data
    const ad = getUserSettingsAd();
    const encrypted = await encryptString(userSettingsJson, { type: 'AesGcmCryptoKey', encryptKey: userSettingsDek }, ad);

    // Combine wrapped key and encrypted data
    const combined = {
        wrappedKey: wrappedKeyBase64,
        encrypted,
    };

    return {
        UserSettingsTag: crypto.randomUUID(), // Unique tag for user settings
        Encrypted: uint8ArrayToBase64String(msgpackEncode(combined) as Uint8Array<ArrayBuffer>),
    };
}

export async function deserializeUserSettings(
    serializedUserSettings: SerializedUserSettings,
    masterKey: AesKwCryptoKey
): Promise<LumoUserSettings | null> {
    try {
        // Decode the combined data
        const combinedBytes = base64StringToUint8Array(serializedUserSettings.encrypted);
        const combined = msgpackDecode(combinedBytes) as {
            wrappedKey: string;
            encrypted: EncryptedData;
        };
        
        // Unwrap the DEK
        const wrappedKeyBytes = base64StringToUint8Array(combined.wrappedKey);
        const userSettingsDek = await unwrapAesKey(wrappedKeyBytes, masterKey);
        
        // Decrypt the user settings data
        const ad = getUserSettingsAd();
        const userSettingsJson = await decryptString(combined.encrypted, userSettingsDek, ad);
        
        const result = JSON.parse(userSettingsJson) as LumoUserSettings;
        
        return result;
    } catch (error) {
        safeLogger.warn('Failed to deserialize user settings:', error);
        return null;
    }
}
