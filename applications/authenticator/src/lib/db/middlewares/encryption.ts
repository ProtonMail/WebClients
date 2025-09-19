import type {
    DeriveEncryptedEntity,
    EncryptedEntityDefinition,
} from 'applications/authenticator/src/lib/db/entities/encryption';
import type { DBCore, IDType, InsertType, Middleware, PromiseExtended, Table } from 'dexie';
import { default as Dexie } from 'dexie';
import logger from 'proton-authenticator/lib/logger';

import { truthy } from '@proton/pass/utils/fp/predicates';
import { isObject } from '@proton/pass/utils/object/is-object';

type EncryptionMiddlewareConfig = {
    db: Dexie;
    encryptedTables: Record<string, EncryptedEntityDefinition<any, any, any>>;
    encryptionKey: CryptoKey;
};

/** Patch core dexie `EntityTable` to support decryption
 * failures causing `null` return types. Cursor based methods
 * now return promises because of the encryption middlware. */
export type EncryptedEntityTable<
    T,
    TKeyPropName extends keyof T = never,
    TInsertType = InsertType<T, TKeyPropName>,
> = Omit<Table<T | null, IDType<T, TKeyPropName>, TInsertType>, 'each'> & {
    each(
        callback: (
            obj: Promise<T | null>,
            cursor: {
                key: any;
                primaryKey: IDType<T, TKeyPropName>;
            }
        ) => any
    ): PromiseExtended<void>;
    toSafeArray: () => Promise<T[]>;
};

export const validateEncryptedValue = <T = any>(value: unknown): value is DeriveEncryptedEntity<T> =>
    Boolean(value && isObject(value) && `__encryptedData` in value);

export const validateEncryptableValue = <T = any>(value: unknown): value is T =>
    Boolean(value && isObject(value) && !(`__encryptedData` in value));

export const createEncryptionMiddleware = (config: EncryptionMiddlewareConfig): Middleware<DBCore>['create'] => {
    return (downlevelDatabase) => {
        /** Add `toSafeArray` method to encrypted tables to filter out
         *  null values that may result from decryption failures */
        Object.defineProperty(config.db.Table.prototype, 'toSafeArray', {
            value: async function () {
                return (await this.toArray()).filter(truthy);
            },
            writable: false,
            enumerable: false,
            configurable: true,
        });

        return {
            ...downlevelDatabase,
            table(tableName) {
                const table = downlevelDatabase.table(tableName);
                const definition = config.encryptedTables[tableName];

                /** No encryption scheme defined for this table,
                 * return the current `table` implementation */
                if (!definition) return table;

                const decrypt = async (value: unknown) => {
                    try {
                        if (!validateEncryptedValue(value)) throw new Error('Nothing to decrypt');
                        const decrypted = await definition.decrypt(value, config.encryptionKey);
                        return decrypted;
                    } catch (err) {
                        logger.warn(`[db::encryption] failed local decryption. ${err}`);
                        return null;
                    }
                };

                const encrypt = async (value: unknown) => {
                    try {
                        if (!validateEncryptableValue(value)) throw new Error('Nothing to encrypt');
                        const encrypted = await definition.encrypt(value, config.encryptionKey);
                        return encrypted;
                    } catch (err) {
                        logger.warn(`[db::encryption] failed local encryption. ${err}`);
                        return null;
                    }
                };

                return {
                    ...table,

                    async openCursor(req) {
                        return table.openCursor(req).then((cursor) => {
                            if (!cursor) return cursor;

                            return Object.create(cursor, {
                                continue: { get: () => cursor.continue },
                                continuePrimaryKey: { get: () => cursor.continuePrimaryKey },
                                primaryKey: { get: () => cursor.primaryKey },
                                key: { get: () => cursor.key },
                                value: { get: () => decrypt(cursor.value) },
                            });
                        });
                    },

                    async get(req) {
                        const data = await table.get(req);
                        return decrypt(data);
                    },

                    async getMany(req) {
                        const items = await table.getMany(req);
                        return (await Promise.all(items.map(decrypt))).filter(truthy);
                    },

                    async query(req) {
                        const res = await table.query(req);

                        if (req.values) {
                            /** If the query is requesting `values` then
                             * we should decrypt the underlying entities */
                            const result = (await Promise.all(res.result.map(decrypt))).filter(truthy);
                            return { ...res, result };
                        }

                        return res;
                    },

                    async mutate(req) {
                        switch (req.type) {
                            case 'add':
                            case 'put': {
                                /** If the request is an `add` or `put` : encrypt & mutate the request
                                 * values. Using `Dexie.waitFor` in case this request is bound to a
                                 * transaction in order to keep it alive during crypto operations */
                                const encryptedValues = await Dexie.waitFor(Promise.all(req.values.map(encrypt)));
                                req.values = encryptedValues.filter(truthy);
                                req.values.forEach((value) => definition.invalidate(value[definition.primaryKey]));
                                break;
                            }
                            case 'delete':
                                if (req.keys) req.keys.forEach(definition.invalidate);
                                else definition.invalidate('*');
                                break;
                            case 'deleteRange':
                                definition.invalidate('*');
                                break;
                        }

                        return table.mutate(req);
                    },
                };
            },
        };
    };
};
