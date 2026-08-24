import { omit } from '@proton/shared/lib/helpers/object';

import type {
    DeobfuscatedItem,
    DeobfuscatedItemExtraField,
    ExtraField,
    Item,
    ItemRevision,
    OpenedItem,
    SafeProtobufExtraField,
    SafeProtobufItem,
} from '../../types';
import { ProtobufItem } from '../../types';
import { AutofillMode } from '../../types/protobuf';
import { Timestamp } from '../../types/protobuf/google/protobuf/timestamp';
import type {
    CustomSection,
    ItemCreditCard,
    ItemCustom,
    ItemIdentity,
    ItemLogin,
    ItemSSHKey,
    ItemWifi,
} from '../../types/protobuf/item-v1';
import { sanitizeBuffersB64 } from '../../utils/buffer/sanitization';
import { formatExpirationDateYYYYMM } from '../../utils/time/expiration-date';
import { parsePasskey } from '../passkeys/utils';
import { getDefaultModeUrls } from '../urls/utils/autofill';
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

const protobufToLoginContent = (login: ItemLogin): DeobfuscatedItem<'login'>['content'] => ({
    ...omit(login, ['urls']),
    /** New clients write the full set of modes into `autofillUrls`. When present it is
     * authoritative and the deprecated `urls` field (a lossy copy) is ignored. Only fall
     * back to mapping `urls` for legacy items written before the autofill modes existed. */
    autofillUrls: login.autofillUrls.length
        ? login.autofillUrls
        : login.urls.map((url) => ({ url, mode: AutofillMode.Default })),
    passkeys: (login.passkeys ?? []).map(sanitizeBuffersB64),
});

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
            return { ...base, type: 'login', content: protobufToLoginContent(data.login) };
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

const loginContentToProtobuf = (login: DeobfuscatedItem<'login'>['content']): ItemLogin => ({
    ...login,
    /** `autofillUrls` carries the full source of truth (every mode). For retro-compat the
     * deprecated `urls` field duplicates only the `Default`-mode urls: an old client reads
     * `urls` as `Default`, so surfacing any other mode there would autofill more broadly than
     * intended. Once all clients are updated we can drop `urls` and keep everything here. */
    urls: getDefaultModeUrls(login.autofillUrls),
    autofillUrls: login.autofillUrls,
    /** Make sure the `passkeys` property exists. It can
     * happen that we try to generate a protobuf for a cached
     * item that was generated before ContentFormat v2 */
    passkeys: (login.passkeys ?? []).map(parsePasskey),
});

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
                content: { content: { oneofKind: 'login', login: loginContentToProtobuf(item.content) } },
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
