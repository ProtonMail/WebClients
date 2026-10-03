import type { Item, ItemType, SafeProtobufItem } from '../../types';
import { decodeItemContent, encodeItemContent, serializeItemContent } from './item-proto.transformer';
import { itemBuilder } from './item.builder';

function checkAndCast<T extends ItemType>(input: SafeProtobufItem, expectedType: T): SafeProtobufItem<T> {
    const { content } = input.content;
    const type = content.oneofKind;

    if (type === expectedType) {
        return input as SafeProtobufItem<any>;
    }

    throw new Error(`oneofKind did not match [input:${type}] [expected:${expectedType}]`);
}

describe('ItemContentTransformer', () => {
    it('should be able to encode and decode a Note', () => {
        const itemName = 'Item' + Math.random();
        const noteContents = 'Contents' + Math.random();
        const sourceItem: SafeProtobufItem = {
            metadata: {
                name: itemName,
                note: noteContents,
                itemUuid: String(Math.random()),
            },
            content: {
                content: {
                    oneofKind: 'note',
                    note: {},
                },
            },
            extraFields: [],
        };

        const encoded = encodeItemContent(sourceItem);
        expect(encoded.length).toBeGreaterThan(0);

        const decoded = decodeItemContent(encoded);
        expect(decoded.metadata.name).toStrictEqual(itemName);

        const note = checkAndCast(decoded, 'note');
        expect(note.metadata.note).toStrictEqual(noteContents);
    });

    it('should be able to encode and decode a Login', () => {
        const itemName = 'Item' + Math.random();
        const itemEmail = 'Email' + Math.random();
        const itemUsername = 'Username' + Math.random();
        const itemPassword = 'Password' + Math.random();

        const sourceItem: SafeProtobufItem = {
            metadata: {
                name: itemName,
                note: '',
                itemUuid: String(Math.random()),
            },
            content: {
                content: {
                    oneofKind: 'login',
                    login: {
                        itemEmail,
                        itemUsername,
                        password: itemPassword,
                        urls: [],
                        autofillUrls: [],
                        totpUri: '',
                        passkeys: [],
                    },
                },
            },
            extraFields: [],
        };

        const encoded = encodeItemContent(sourceItem);
        expect(encoded.length).toBeGreaterThan(0);

        const decoded = decodeItemContent(encoded);
        expect(decoded.metadata.name).toStrictEqual(itemName);

        const login = checkAndCast(decoded, 'login');
        expect(login.content.content.login.itemEmail).toStrictEqual(itemEmail);
        expect(login.content.content.login.itemUsername).toStrictEqual(itemUsername);
        expect(login.content.content.login.password).toStrictEqual(itemPassword);
    });

    describe('metadata icon', () => {
        const icon =
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        const createItem = (metadata: Partial<Item['metadata']> = {}): Item<'login'> => {
            const item = itemBuilder('login').data;
            item.metadata = { ...item.metadata, name: 'Item', ...metadata };
            return item;
        };

        it('should preserve `metadata.icon` through serialization', () => {
            const item = createItem({ icon });
            const decoded = decodeItemContent(serializeItemContent(item));

            expect(decoded.metadata.icon).toStrictEqual(icon);
            expect(decoded.metadata.name).toStrictEqual('Item');
            expect(decoded.metadata.itemUuid).toStrictEqual(item.metadata.itemUuid);
        });

        it('should not set `metadata.icon` for items without icon', () => {
            const item = createItem();
            const encoded = serializeItemContent(item);
            const decoded = decodeItemContent(encoded);

            expect(decoded.metadata.icon).toBeUndefined();
            expect('icon' in decoded.metadata).toBe(false);
            expect(decoded.metadata.name).toStrictEqual('Item');
            expect(decoded.metadata.itemUuid).toStrictEqual(item.metadata.itemUuid);
            expect(decoded.content.content.oneofKind).toStrictEqual('login');
        });

        it('should produce identical bytes for items without icon and with `icon: undefined`', () => {
            const item = createItem();
            const withUndefinedIcon = { ...item, metadata: { ...item.metadata, icon: undefined } };

            expect(serializeItemContent(withUndefinedIcon)).toStrictEqual(serializeItemContent(item));
        });
    });
});
