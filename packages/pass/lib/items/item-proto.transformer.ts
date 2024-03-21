import { parsePasskey } from '@proton/pass/lib/passkeys/utils';
import { formatExpirationDateYYYYMM } from '@proton/pass/lib/validation/credit-card';
import type {
    Item,
    ItemRevision,
    OpenedItem,
    SafeProtobufExtraField,
    SafeProtobufItem,
    UnsafeItem,
    UnsafeItemExtraField,
} from '@proton/pass/types';
import { ProtobufItem } from '@proton/pass/types';
import type { ItemCreditCard } from '@proton/pass/types/protobuf/item-v1';
import { sanitizeBuffers } from '@proton/pass/utils/buffer/sanitization';
import { omit } from '@proton/shared/lib/helpers/object';

import { deobfuscateItem, obfuscateItem } from './item.obfuscation';

const protobufToExtraField = ({ fieldName, ...field }: SafeProtobufExtraField): UnsafeItemExtraField => {
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
        default:
            throw new Error('Unsupported extra field type');
    }
};

const protobufToCreditCardContent = (creditCard: ItemCreditCard): UnsafeItem<'creditCard'>['content'] => ({
    ...creditCard,
    number: creditCard.number,
    verificationNumber: creditCard.verificationNumber,
    pin: creditCard.pin,
    expirationDate: creditCard.expirationDate,
});

const protobufToItem = (item: SafeProtobufItem): UnsafeItem => {
    const { platformSpecific, metadata, content: itemContent } = item;

    const base = {
        metadata: { ...metadata, note: metadata.note },
        extraFields: item.extraFields.map(protobufToExtraField),
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
        default:
            throw new Error('Unsupported item type');
    }
};

const extraFieldToProtobuf = ({ fieldName, ...extraField }: UnsafeItemExtraField): SafeProtobufExtraField => {
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
        default:
            throw new Error('Unsupported extra field type');
    }
};

const creditCardContentToProtobuf = (creditCard: UnsafeItem<'creditCard'>['content']): ItemCreditCard => ({
    ...creditCard,
    expirationDate: formatExpirationDateYYYYMM(creditCard.expirationDate),
    number: creditCard.number,
    verificationNumber: creditCard.verificationNumber,
    pin: creditCard.pin,
});

const itemToProtobuf = (item: UnsafeItem): SafeProtobufItem => {
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
        default:
            throw new Error('Unsupported item type');
    }
};

export const encodeItemContent = (item: SafeProtobufItem): Uint8Array => ProtobufItem.toBinary(item);

/* serialization will strip extraneous data */
export const serializeItemContent = (item: Item): Uint8Array => {
    const protobuf = itemToProtobuf(deobfuscateItem(item));
    return encodeItemContent(protobuf);
};

export const decodeItemContent = (item: Uint8Array): SafeProtobufItem => {
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
