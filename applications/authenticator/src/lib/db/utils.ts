import { default as Dexie } from 'dexie';

import type { Result } from '@proton/pass/types';
import { wait } from '@proton/shared/lib/helpers/promise';

const AuthenticatorDBErrorFactory = (name: string) =>
    class AuthenticatorDBError extends Error {
        constructor(message: string) {
            super(message);
            this.name = name;
        }
    };

export const AuthenticatorDBClosedError = AuthenticatorDBErrorFactory('AuthenticatorDBClosedError');
export const AuthenticatorDBMigrationError = AuthenticatorDBErrorFactory('AuthenticatorDBMigrationError');
export const AuthenticatorDBTimeoutError = AuthenticatorDBErrorFactory('AuthenticatorDBTimeoutError');

/** Opens a Dexie database and waits for it to be ready.
 * Uses the 'ready' event to ensure the database is fully initialized
 * before resolving the promise (migrations/upgrades finished) */
export const openDB = async (db: Dexie) => {
    void db.open();

    return new Promise<void>((resolve, reject) => {
        db.on('ready', () => resolve());
        db.on('close', () => reject(new AuthenticatorDBClosedError('Database was closed')));
        return wait(15_000).then(() => reject(new AuthenticatorDBTimeoutError('Database timed out')));
    });
};

/** Closes a Dexie database connection and waits briefly to ensure
 * the core IDB connection is fully terminated before continuing */
export const closeDB = async (db: Dexie) => {
    db.close();
    await wait(50);
};

/** Executes a database operation without schema versioning/upgrades.
 * Useful for sanity checks, version queries, or data recovery. */
export const executeRawDBOperation = async <R>(
    name: string,
    operation: (db: Dexie) => R
): Promise<Result<{ data: Awaited<R> }>> => {
    const db = new Dexie(name, { autoOpen: false });

    try {
        await db.open();
        const data = await operation(db);
        return { ok: true, data };
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : null };
    } finally {
        await closeDB(db);
    }
};

/** Gets the current schema version of an existing database.
 * Returns null if database doesn't exist or cannot be opened. */
export const getCurrentDBVersion = (name: string) =>
    executeRawDBOperation(name, (db) => db.verno).then((res) => (res.ok ? res.data : null));
