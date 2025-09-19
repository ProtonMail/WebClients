import type { AuthenticatorEncryptionTag } from 'proton-authenticator/lib/crypto';

import { decryptData, generateKey, importKey } from '@proton/crypto/lib/subtle/aesGcm';
import { stringToUtf8Array } from '@proton/crypto/lib/utils';
import { uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';

import { defineEncryptedEntity } from './encryption';

type Item = {
    id: string;
    secret: string;
    data: Record<string, any>;
};

const TestAuthenticatorTag = `test;tag` as AuthenticatorEncryptionTag;

const ItemEntity = defineEncryptedEntity<Item>()({
    primaryKey: 'id',
    safeProps: ['id'] as const,
    tag: TestAuthenticatorTag,
});

describe('EncryptedEntity', () => {
    describe('encrypt', () => {
        test('should preserve `safeProps` & encrypt sensitive data', async () => {
            const key = await importKey(generateKey());
            const entity: Item = { id: '123', secret: 'password', data: { secret2: 'password2' } };
            const encrypted = await ItemEntity.encrypt(entity, key);

            expect(encrypted.id).toBe('123');
            expect(encrypted.__encryptedData).toBeInstanceOf(Uint8Array);
            expect(encrypted.__encryptedData.length).toBeGreaterThan(0);

            expect('secret' in encrypted).toBe(false);
            expect('data' in encrypted).toBe(false);

            const additionalContext = stringToUtf8Array(TestAuthenticatorTag);
            const { __encryptedData: data } = encrypted;
            const decrypted = await decryptData(key, data, additionalContext);
            const parsed = JSON.parse(uint8ArrayToString(decrypted));

            expect(parsed).toEqual({ secret: 'password', data: { secret2: 'password2' } });
        });
    });

    describe('decrypt', () => {
        test('should reconstruct original object from encrypted data', async () => {
            const key = await importKey(generateKey());
            const entity: Item = { id: '123', secret: 'password', data: { secret2: 'password2' } };
            const encrypted = await ItemEntity.encrypt(entity, key);
            const decrypted = await ItemEntity.decrypt(encrypted, key);

            expect(decrypted).toEqual(entity);
            expect('__encryptedData' in decrypted).toBe(false);
        });
    });
});
