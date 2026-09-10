import { generateKey, importKey } from '@protontech/crypto/subtle/aesGcm.ts';

import type { Item } from './items';
import { ItemEntity } from './items';

const getItem = (): Item => ({
    entryType: 'Totp',
    id: 'item-1',
    issuer: 'LocalTest',
    name: 'test@example.invalid',
    note: 'note',
    order: 0,
    period: 30,
    secret: 'JBSWY3DPEHPK3PXP',
    uri: 'otpauth://totp/LocalTest:test@example.invalid?secret=JBSWY3DPEHPK3PXP',
});

describe('ItemEntity', () => {
    beforeEach(() => ItemEntity.invalidate('*'));

    test('should only store `id` & `order` in clear-text', async () => {
        const key = await importKey(generateKey());
        const encrypted = await ItemEntity.encrypt(getItem(), key);

        expect(Object.keys(encrypted).sort()).toEqual(['__encryptedData', 'id', 'order']);
    });

    test('should decrypt an item', async () => {
        const key = await importKey(generateKey());
        const item = getItem();
        const encrypted = await ItemEntity.encrypt(item, key);

        expect(await ItemEntity.decrypt(encrypted, key)).toEqual(item);
    });

    test('should preserve legacy `issuer` & `name` fields', async () => {
        const key = await importKey(generateKey());
        const { issuer, name, ...item } = getItem();
        const legacy = { ...(await ItemEntity.encrypt(item as Item, key)), issuer, name };

        ItemEntity.invalidate('*');
        expect(await ItemEntity.decrypt(legacy, key)).toMatchObject({ issuer, name });
    });
});
