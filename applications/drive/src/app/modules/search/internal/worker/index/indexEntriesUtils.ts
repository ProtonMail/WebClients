import type { Entry } from '@proton/proton-foundation-search';
import { ExportEventKind } from '@proton/proton-foundation-search';

import type { IndexInstance } from './IndexRegistry';

/**
 * Default number of ids processed per write session in `removeDocumentIds`.
 * Keeps any single WASM write session bounded.
 */
export const DEFAULT_BATCH_SIZE = 50;

/**
 * Stream every entry in the engine via `engine.export()`. The Entry is
 * freed automatically when the consumer's `for await` loop moves on, so
 * callers must NOT hold an Entry reference across yields.
 */
export async function* exportEntries(instance: IndexInstance, signal: AbortSignal): AsyncGenerator<Entry> {
    signal.throwIfAborted();
    const exp = instance.engine.export();
    try {
        for (let event = exp.next(); event !== undefined; event = exp.next()) {
            signal.throwIfAborted();
            switch (event.kind()) {
                case ExportEventKind.Load:
                    await instance.blobStore.loadEvent(event);
                    break;
                case ExportEventKind.Entry: {
                    const entry = event.entry();
                    if (!entry) {
                        break;
                    }
                    try {
                        yield entry;
                    } finally {
                        entry.free();
                    }
                    break;
                }
            }
        }
    } finally {
        exp.free();
    }
}

/**
 * Open a write session, remove every given id, commit.
 * Returns the number of removed ids.
 */
export async function removeDocumentIds(
    instance: IndexInstance,
    idsToRemove: Iterable<string>,
    signal: AbortSignal
): Promise<number> {
    signal.throwIfAborted();
    const ids = [...idsToRemove];
    if (ids.length === 0) {
        return 0;
    }

    const session = instance.indexWriter.startWriteSession();
    try {
        for (const id of ids) {
            signal.throwIfAborted();
            session.remove(id);
        }
        await session.commit();
    } catch (e) {
        session.dispose();
        throw e;
    }
    return ids.length;
}
