import type { ItemType, SafeProtobufItem } from '@proton/pass/types';

import { decodeItemContent, encodeItemContent } from './item-proto.transformer';

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
});
