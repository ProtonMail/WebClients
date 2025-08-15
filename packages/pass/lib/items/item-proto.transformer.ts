import { parsePasskey } from '@proton/pass/lib/passkeys/utils';
import type {
    DeobfuscatedItem,
    DeobfuscatedItemExtraField,
    ExtraField,
    Item,
    ItemRevision,
    OpenedItem,
    SafeProtobufExtraField,
    SafeProtobufItem,
} from '@proton/pass/types';
import { ProtobufItem } from '@proton/pass/types';
import { Timestamp } from '@proton/pass/types/protobuf/google/protobuf/timestamp';
import type {
    CustomSection,
    ItemCreditCard,
    ItemCustom,
    ItemIdentity,
    ItemSSHKey,
    ItemWifi,
} from '@proton/pass/types/protobuf/item-v1';
import { sanitizeBuffers } from '@proton/pass/utils/buffer/sanitization';
import { formatExpirationDateYYYYMM } from '@proton/pass/utils/time/expiration-date';
import { omit } from '@proton/shared/lib/helpers/object';

import { deobfuscateItem, obfuscateItem } from './item.obfuscation';

const protobufSafeToExtraField = ({ fieldName, ...field }: SafeProtobufExtraField): DeobfuscatedItemExtraField => {
    switch (field.content.oneofKind) {
        case 'text':
            return {
                fieldName,
                type: field.content.oneofKind,
                data: { content: field.content.text.content },
            };
        case 'hidden':
            return {
                fieldName,
                type: field.content.oneofKind,
                data: { content: field.content.hidden.content },
            };
        case 'totp':
            return {
                fieldName,
                type: field.content.oneofKind,
                data: { totpUri: field.content.totp.totpUri },
            };
        case 'timestamp':
            return {
                fieldName,
                type: field.content.oneofKind,
                data: {
                    timestamp: field.content.timestamp.timestamp
                        ? Timestamp.toDate(field.content.timestamp.timestamp).toISOString().split('T')[0]
                        : '',
                },
            };
        default:
            throw new Error('Unsupported extra field type');
    }
};

const protobufToCreditCardContent = (creditCard: ItemCreditCard): DeobfuscatedItem<'creditCard'>['content'] => ({
    ...creditCard,
    number: creditCard.number,
    verificationNumber: creditCard.verificationNumber,
    pin: creditCard.pin,
    expirationDate: creditCard.expirationDate,
});

const parseUnsafeExtraField =
    (converter: (s: SafeProtobufExtraField) => DeobfuscatedItemExtraField) => (extraField: ExtraField) =>
        converter(extraField as SafeProtobufExtraField);

const protobufToIdentityContent = (identity: ItemIdentity): DeobfuscatedItem<'identity'>['content'] => ({
    ...identity,
    extraAddressDetails: identity.extraAddressDetails.map(parseUnsafeExtraField(protobufSafeToExtraField)),
    extraContactDetails: identity.extraContactDetails.map(parseUnsafeExtraField(protobufSafeToExtraField)),
    extraPersonalDetails: identity.extraPersonalDetails.map(parseUnsafeExtraField(protobufSafeToExtraField)),
    extraWorkDetails: identity.extraWorkDetails.map(parseUnsafeExtraField(protobufSafeToExtraField)),
    extraSections: identity.extraSections.map((extraSections) => ({
        ...extraSections,
        sectionFields: extraSections.sectionFields.map(parseUnsafeExtraField(protobufSafeToExtraField)),
    })),
});

const parseExtraSections = (sections: CustomSection[]) =>
    sections.map((section) => ({
        ...section,
        sectionFields: section.sectionFields.map(parseUnsafeExtraField(protobufSafeToExtraField)),
    }));

const protobufToSshContent = (sshKey: ItemSSHKey): DeobfuscatedItem<'sshKey'>['content'] => ({
    ...sshKey,
    sections: parseExtraSections(sshKey.sections),
});

const protobufToWifiContent = (wifi: ItemWifi): DeobfuscatedItem<'wifi'>['content'] => ({
    ...wifi,
    sections: parseExtraSections(wifi.sections),
});

const protobufToCustomContent = (custom: ItemCustom): DeobfuscatedItem<'custom'>['content'] => ({
    sections: parseExtraSections(custom.sections),
});

export const protobufToItem = (item: SafeProtobufItem): DeobfuscatedItem => {
    const { platformSpecific, metadata, content: itemContent } = item;

    const base = {
        metadata: { ...metadata, note: metadata.note },
        extraFields: item.extraFields.map(protobufSafeToExtraField),
        platformSpecific,
    };

    const { content: data } = itemContent;

    switch (data.oneofKind) {
        case 'login':
            return {
                ...base,
                type: 'login',
                content: { ...data.login, passkeys: (data.login.passkeys ?? []).map(sanitizeBuffers) },
            };
        case 'note':
            return { ...base, type: 'note', content: data.note };
        case 'alias':
            return { ...base, type: 'alias', content: data.alias };
        case 'creditCard':
            return { ...base, type: 'creditCard', content: protobufToCreditCardContent(data.creditCard) };
        case 'identity':
            return { ...base, type: 'identity', content: protobufToIdentityContent(data.identity) };
        case 'sshKey':
            return { ...base, type: 'sshKey', content: protobufToSshContent(data.sshKey) };
        case 'wifi':
            return { ...base, type: 'wifi', content: protobufToWifiContent(data.wifi) };
        case 'custom':
            return { ...base, type: 'custom', content: protobufToCustomContent(data.custom) };
        default:
            throw new Error('Unsupported item type');
    }
};

const extraFieldToProtobuf = ({ fieldName, ...extraField }: DeobfuscatedItemExtraField): SafeProtobufExtraField => {
    switch (extraField.type) {
        case 'text':
            return {
                fieldName,
                content: {
                    oneofKind: 'text',
                    text: { ...extraField.data, content: extraField.data.content },
                },
            };
        case 'hidden':
            return {
                fieldName,
                content: {
                    oneofKind: 'hidden',
                    hidden: { ...extraField.data, content: extraField.data.content },
                },
            };
        case 'totp':
            return {
                fieldName,
                content: {
                    oneofKind: 'totp',
                    totp: { ...extraField.data, totpUri: extraField.data.totpUri },
                },
            };
        case 'timestamp':
            const parsedDate = new Date(extraField.data.timestamp);
            return {
                fieldName,
                content: {
                    oneofKind: 'timestamp',
                    timestamp: {
                        ...extraField.data,
                        timestamp:
                            parsedDate instanceof Date && isFinite(+parsedDate)
                                ? Timestamp.fromDate(parsedDate)
                                : undefined,
                    },
                },
            };
        default:
            throw new Error('Unsupported extra field type');
    }
};

const creditCardContentToProtobuf = (creditCard: DeobfuscatedItem<'creditCard'>['content']): ItemCreditCard => ({
    ...creditCard,
    expirationDate: formatExpirationDateYYYYMM(creditCard.expirationDate),
    number: creditCard.number,
    verificationNumber: creditCard.verificationNumber,
    pin: creditCard.pin,
});

const identityContentToProtobuf = (identity: DeobfuscatedItem<'identity'>['content']): ItemIdentity => ({
    ...identity,
    extraAddressDetails: identity.extraAddressDetails.map(extraFieldToProtobuf),
    extraContactDetails: identity.extraContactDetails.map(extraFieldToProtobuf),
    extraPersonalDetails: identity.extraPersonalDetails.map(extraFieldToProtobuf),
    extraWorkDetails: identity.extraWorkDetails.map(extraFieldToProtobuf),
    extraSections: identity.extraSections.map((extraSections) => ({
        ...extraSections,
        sectionFields: extraSections.sectionFields.map(extraFieldToProtobuf),
    })),
});

const sshKeyContentToProtobuf = (sshKey: DeobfuscatedItem<'sshKey'>['content']): ItemSSHKey => ({
    privateKey: sshKey.privateKey,
    publicKey: sshKey.publicKey,
    sections: sshKey.sections.map((section) => ({
        ...section,
        sectionFields: section.sectionFields.map(extraFieldToProtobuf),
    })),
});

const wifiContentToProtobuf = (wifi: DeobfuscatedItem<'wifi'>['content']): ItemWifi => ({
    ssid: wifi.ssid,
    password: wifi.password,
    security: wifi.security,
    sections: wifi.sections.map((section) => ({
        ...section,
        sectionFields: section.sectionFields.map(extraFieldToProtobuf),
    })),
});

const customContentToProtobuf = (custom: DeobfuscatedItem<'custom'>['content']): ItemCustom => ({
    sections: custom.sections.map((section) => ({
        ...section,
        sectionFields: section.sectionFields.map(extraFieldToProtobuf),
    })),
});

const itemToProtobuf = (item: DeobfuscatedItem): SafeProtobufItem => {
    const { platformSpecific, metadata } = item;

    const base = {
        metadata: { ...metadata, note: metadata.note },
        extraFields: item.extraFields.map(extraFieldToProtobuf),
        platformSpecific,
    };

    switch (item.type) {
        case 'login': {
            return {
                ...base,
                content: {
                    content: {
                        oneofKind: 'login',
                        login: {
                            ...item.content,
                            /** Make sure the `passkeys` property exists. It can
                             * happen that we try to generate a protobuf for a cached
                             * item that was generated before ContentFormat v2 */
                            passkeys: (item.content.passkeys ?? []).map(parsePasskey),
                        },
                    },
                },
            };
        }
        case 'note':
            return { ...base, content: { content: { oneofKind: 'note', note: item.content } } };
        case 'alias':
            return { ...base, content: { content: { oneofKind: 'alias', alias: item.content } } };
        case 'creditCard':
            return {
                ...base,
                content: {
                    content: { oneofKind: 'creditCard', creditCard: creditCardContentToProtobuf(item.content) },
                },
            };
        case 'identity':
            return {
                ...base,
                content: {
                    content: { oneofKind: 'identity', identity: identityContentToProtobuf(item.content) },
                },
            };
        case 'sshKey':
            return {
                ...base,
                content: {
                    content: {
                        oneofKind: 'sshKey',
                        sshKey: sshKeyContentToProtobuf(item.content),
                    },
                },
            };
        case 'wifi':
            return {
                ...base,
                content: {
                    content: {
                        oneofKind: 'wifi',
                        wifi: wifiContentToProtobuf(item.content),
                    },
                },
            };
        case 'custom':
            return {
                ...base,
                content: {
                    content: { oneofKind: 'custom', custom: customContentToProtobuf(item.content) },
                },
            };
        default:
            throw new Error('Unsupported item type');
    }
};

export const encodeItemContent = (item: SafeProtobufItem): Uint8Array<ArrayBuffer> =>
    ProtobufItem.toBinary(item) as Uint8Array<ArrayBuffer>;

/* serialization will strip extraneous data */
export const serializeItemContent = (item: Item): Uint8Array<ArrayBuffer> => {
    const protobuf = itemToProtobuf(deobfuscateItem(item));
    return encodeItemContent(protobuf);
};

export const decodeItemContent = (item: Uint8Array<ArrayBuffer>): SafeProtobufItem => {
    const decoded = ProtobufItem.fromBinary(item);

    if (decoded.metadata === undefined) {
        throw new Error('Missing metadata message');
    }

    if (decoded.content === undefined || decoded.content.content.oneofKind === undefined) {
        throw new Error('Missing or corrupted content message');
    }

    return decoded as SafeProtobufItem;
};

export const parseOpenedItem = (data: { openedItem: OpenedItem; shareId: string }): ItemRevision => {
    const content = decodeItemContent(data.openedItem.content);

    return {
        shareId: data.shareId,
        data: obfuscateItem(protobufToItem(content)),
        ...omit(data.openedItem, ['content']),
    };
};
