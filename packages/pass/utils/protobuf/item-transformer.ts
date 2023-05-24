import type {
    ExtraFieldContentMap,
    ExtraFieldType,
    Item,
    ItemContentMap,
    ItemExtraField,
    ItemRevision,
    ItemType,
    OpenedItem,
    SafeProtobufExtraField,
    SafeProtobufItem,
} from '@proton/pass/types';
import { ProtobufItem } from '@proton/pass/types';
import { omit } from '@proton/shared/lib/helpers/object';

const getExtraFieldContentKey = <T extends ExtraFieldType>(type: T) => {
    return {
        totp: 'totpUri',
        text: 'content',
        hidden: 'content',
    }[type] as keyof ExtraFieldContentMap[T];
};

const protobufToExtraField = <T extends ExtraFieldType>(field: SafeProtobufExtraField<T>): ItemExtraField => {
    const type = field.content.oneofKind;
    const content = field.content[type] as ExtraFieldContentMap[ExtraFieldType];

    return {
        fieldName: field.fieldName,
        type: type,
        value: content[getExtraFieldContentKey(type as ExtraFieldType)],
    } as ItemExtraField;
};

const protobufToItem = <T extends ItemType>(item: SafeProtobufItem<T>): Item<T> => {
    const { platformSpecific, metadata, content: itemContent } = item;
    const { content: data } = itemContent;
    const type = data.oneofKind;
    const content = data[type] as ItemContentMap[ItemType];
    const extraFields = item.extraFields.map(protobufToExtraField);

    return {
        type,
        content,
        metadata,
        extraFields,
        platformSpecific,
    } as Item<T>;
};

const extraFieldToProtobuf = <T extends ExtraFieldType>({
    fieldName,
    type,
    value,
}: ItemExtraField): SafeProtobufExtraField<T> => {
    return {
        fieldName,
        content: {
            oneofKind: type,
            [type]: {
                [getExtraFieldContentKey(type)]: value,
            },
        },
    } as SafeProtobufExtraField<T>;
};

const itemToProtobuf = <T extends ItemType>(item: Item<T>): SafeProtobufItem<T> => {
    const { type, content, platformSpecific, metadata } = item;
    const extraFields = item.extraFields.map(extraFieldToProtobuf);

    return {
        content: {
            content: {
                oneofKind: type,
                [type]: content,
            },
        },
        metadata,
        extraFields,
        platformSpecific,
    } as SafeProtobufItem<T>;
};

export const encodeItemContent = (item: SafeProtobufItem): Uint8Array => ProtobufItem.toBinary(item);

/**
 * serialization will strip extraneous data
 */
export const serializeItemContent = (item: Item): Uint8Array => {
    const protobuf = itemToProtobuf(item);
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
        data: protobufToItem(content),
        ...omit(data.openedItem, ['content']),
    };
};
