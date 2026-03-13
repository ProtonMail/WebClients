import type { Engine as SearchLibraryWasmEngine } from '@proton/proton-foundation-search';
import { Document, SerDes, Value, WriteEventKind } from '@proton/proton-foundation-search';

import type { EngineDB } from '../storage/EngineDB';

/**
 * Index a set of documents into the WASM engine and persist the blobs to the DB,
 * mirroring what IndexWriter.WriteSession.commit() does.
 */
export async function indexDocuments(
    engine: SearchLibraryWasmEngine,
    db: EngineDB,
    configKey: string,
    documents: { id: string; filename: string }[]
): Promise<void> {
    const writer = engine.write();
    if (!writer) {
        throw new Error('indexDocuments: engine.write() returned undefined — a write session is already in progress');
    }
    for (const doc of documents) {
        const document = new Document(doc.id);
        document.addAttribute('filename', Value.text(doc.filename));
        writer.insert(document);
    }

    const execution = writer.commit();
    let event;
    while ((event = execution.next()) !== undefined) {
        switch (event.kind()) {
            case WriteEventKind.Load: {
                const blobName = event.id().toString();
                const stored = await db.getIndexBlob(configKey, blobName);
                if (stored !== undefined) {
                    event.send(SerDes.Cbor, new Uint8Array(stored));
                } else {
                    event.sendEmpty();
                }
                break;
            }
            case WriteEventKind.Save: {
                const blobName = event.id().toString();
                const serialized = event.recv().serialize(SerDes.Cbor);
                await db.putIndexBlob(configKey, blobName, serialized.buffer as ArrayBuffer);
                break;
            }
            case WriteEventKind.Stats:
                event.free();
                break;
            default:
                event.free();
                break;
        }
    }
    execution.free();

    await db.setEngineState({ activeConfigKey: configKey });
}
