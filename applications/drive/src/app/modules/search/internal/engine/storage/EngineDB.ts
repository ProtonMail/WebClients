import type { DBSchema, IDBPDatabase } from 'idb';
import { openDB } from 'idb';

const engineDbVersion = 1;

// Generate a db name following this format: "search-db:<engineLabel>:<userId>".
const engineDbName = (userID: string, engineLabel: string) => {
    const SEPARATOR = ':';
    if (engineLabel.indexOf(SEPARATOR) !== -1) {
        throw new Error(`Invalid engine label <${engineLabel}>: Contains character ${SEPARATOR}`);
    }
    if (userID.indexOf(SEPARATOR) !== -1) {
        throw new Error(`Invalid userId: Contains character ${SEPARATOR}`);
    }
    return ['search-db', engineLabel, userID].join(SEPARATOR);
};

export interface EngineState {
    activeConfigKey: string | null;

    // TODO: Add generation counter to allow reprocessing same config without dropping the old one.
    // TODO: Add error count for given generation to avoid infinite reprocessing loops.
}

interface EngineDBSchema extends DBSchema {
    state: {
        key: string;
        value: EngineState;
    };
    indexBlobs: {
        // [configKey, blobName] — the search library assigns a name to each blob it produces.
        // Scoping by config allows selective cleanup when the active config changes.
        key: [string, string];
        value: ArrayBuffer;
    };
}

type RawEngineDB = IDBPDatabase<EngineDBSchema>;

const defaultState: EngineState = {
    activeConfigKey: null,
};

/**
 * Encapsulates all IndexedDB operations for a single engine's search database.
 * Each instance is bound to one IndexedDB database named "search-db:<engineLabel>:<userId>",
 * providing isolation by both user and engine label at the storage level.
 */
export class EngineDB {
    private constructor(private readonly db: RawEngineDB) {}

    static async open(userID: string, engineLabel: string): Promise<EngineDB> {
        const db = await openDB<EngineDBSchema>(engineDbName(userID, engineLabel), engineDbVersion, {
            upgrade(database, oldVersion) {
                if (oldVersion < 1) {
                    database.createObjectStore('state');
                    database.createObjectStore('indexBlobs');
                }
            },
        });
        return new EngineDB(db);
    }

    // Engine state

    async getEngineState(): Promise<EngineState> {
        return (await this.db.get('state', 'global')) ?? { ...defaultState };
    }

    async setEngineState(patch: Partial<EngineState>): Promise<void> {
        const current = await this.getEngineState();
        await this.db.put('state', { ...current, ...patch }, 'global');
    }

    // TODO: Add configKey-specific state.
    // Example: Number of errors on BulkUpdate to avoid infinite loops of fetching, current generation counter to
    // allow reprocessing of a given configKey.

    // Index blobs - keyed by configKey and blobName.

    getIndexBlob(configKey: string, blobName: string): Promise<ArrayBuffer | undefined> {
        return this.db.get('indexBlobs', [configKey, blobName]);
    }

    putIndexBlob(configKey: string, blobName: string, blob: ArrayBuffer): Promise<[string, string]> {
        return this.db.put('indexBlobs', blob, [configKey, blobName]);
    }

    deleteIndexBlob(configKey: string, blobName: string): Promise<void> {
        return this.db.delete('indexBlobs', [configKey, blobName]);
    }
}
