import type { AuthenticatorEncryptionTag } from 'proton-authenticator/lib/crypto';

import { decryptData, encryptData } from '@proton/crypto/lib/subtle/aesGcm';
import { stringToUtf8Array, utf8ArrayToString } from '@proton/crypto/lib/utils';

type JsonPrimitive = string | number | boolean | null;
type JsonArray = JsonValue[];
type JsonValue = JsonPrimitive | JsonArray | JsonObject;
type JsonObject = { [key: string]: JsonValue };

export interface EncryptedEntityDefinition<T extends JsonObject, K extends keyof T, PK extends K> {
    /** Props kept in clear-text */
    safeProps: readonly K[];
    primaryKey: PK;
    /** Encryption tag */
    tag: AuthenticatorEncryptionTag;
    /** Type-safe encrypt method */
    encrypt(value: T, key: CryptoKey): Promise<Pick<T, K> & { __encryptedData: Uint8Array<ArrayBuffer> }>;
    /** Type-safe decrypt method */
    decrypt(encrypted: Pick<T, K> & { __encryptedData: Uint8Array<ArrayBuffer> }, key: CryptoKey): Promise<T>;
    /** Invalidate a cached decryption */
    invalidate(primaryKey: EncryptedEntity<T, K>[PK] | '*'): void;
}

type EncryptedEntity<T extends JsonObject, K extends keyof T> = Pick<T, K> & {
    __encryptedData: Uint8Array<ArrayBuffer>;
};

export type DeriveEncryptedEntity<EntityDef> =
    EntityDef extends EncryptedEntityDefinition<infer T, infer K, any>
        ? Pick<T, K> & { __encryptedData: Uint8Array<ArrayBuffer> }
        : never;

export const defineEncryptedEntity =
    <T extends JsonObject>() =>
    <K extends keyof T, PK extends K>(definition: {
        primaryKey: PK;
        safeProps: readonly K[];
        tag: AuthenticatorEncryptionTag;
    }): EncryptedEntityDefinition<T, K, PK> => {
        /** Store a decryption cache to avoid decrypting */
        const cache = new Map<EncryptedEntity<T, K>[PK], T>();

        return {
            ...definition,

            /** Encrypts properties excluding `safeProps` into a
             * Uint8Array<ArrayBuffer> buffer stored in `__encryptedData`*/
            async encrypt(value: T, key: CryptoKey): Promise<EncryptedEntity<T, K>> {
                const toEncrypt = { ...value };
                const entity = {} as EncryptedEntity<T, K>;

                for (const prop of definition.safeProps) {
                    (entity as any)[prop] = toEncrypt[prop];
                    delete toEncrypt[prop];
                }

                /** NOTE: Data is serialized via `JSON.stringify` before encryption.
                 * This can cause data loss for non-JSON types (Dates become strings,
                 * Uint8Array<ArrayBuffer>s become objects, etc.). The `JsonObject` type constraint
                 * prevents most issues, but we should use structured serialization.. */
                const data = stringToUtf8Array(JSON.stringify(toEncrypt));
                entity.__encryptedData = await encryptData(key, data, stringToUtf8Array(definition.tag));

                return entity;
            },

            async decrypt(encrypted: EncryptedEntity<T, K>, key: CryptoKey): Promise<T> {
                const pk = encrypted[definition.primaryKey];
                if (cache.has(pk)) return cache.get(pk)!;

                const decryptedData = await decryptData(
                    key,
                    encrypted.__encryptedData,
                    stringToUtf8Array(definition.tag)
                );
                const decryptedProps = JSON.parse(utf8ArrayToString(decryptedData));

                const entity = { ...encrypted, ...decryptedProps } as T;
                delete (entity as any).__encryptedData;

                cache.set(pk, entity);
                return entity;
            },

            invalidate(key: EncryptedEntity<T, K>[PK] | '*') {
                if (key === '*') cache.clear();
                else cache.delete(key);
            },
        };
    };
