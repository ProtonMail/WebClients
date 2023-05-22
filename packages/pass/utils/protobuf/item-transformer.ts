import type {
    Item,
    ItemRevision,
    ItemType,
    OpenedItem,
    ProtobufContentMap,
    SafeProtobufItem,
} from '@proton/pass/types';
import { ProtobufItem } from '@proton/pass/types';
import { omit } from '@proton/shared/lib/helpers/object';

const protobufToItem = <T extends ItemType>(item: SafeProtobufItem<T>): Item<T> => {
    const { platformSpecific, metadata, content: itemContent, extraFields } = item;
    const { content: data } = itemContent;

    const type = data.oneofKind;
    const content = data[type] as ProtobufContentMap[ItemType];

    return {
        type,
        content,
        metadata,
        extraFields,
        platformSpecific,
    } as Item<T>;
};

const itemToProtobuf = <T extends ItemType>(item: Item<T>): SafeProtobufItem<T> => {
    const { type, content, extraFields, platformSpecific, metadata } = item;

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
