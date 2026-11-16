import type { CleanupEvent, Engine } from '@proton/proton-foundation-search';
import { CleanupEventKind } from '@proton/proton-foundation-search';

import type { OpenBlobTransaction } from '../crypto/EncryptedBlobTransaction';
import { isLoadEvent, isReleaseEvent, isSaveEvent } from '../utils/eventTypeGuards';

export async function cleanup(
    engine: Engine,
    blobTxn: OpenBlobTransaction,
    abortSignal: AbortSignal | undefined
): Promise<void> {
    abortSignal?.throwIfAborted();
    const cleanup = engine.cleanup();
    if (!cleanup) {
        throw new Error("can't cleanup, other operation in progress");
    }
    let event: CleanupEvent | undefined;
    try {
        while ((event = cleanup.next())) {
            abortSignal?.throwIfAborted();
            if (isLoadEvent(event)) {
                await blobTxn.handleLoadEvent(event);
            } else if (isReleaseEvent(event)) {
                blobTxn.handleReleaseEvent(event);
            } else if (isSaveEvent(event)) {
                blobTxn.handleSaveEvent(event);
            } else if (event.kind() === CleanupEventKind.Tracked) {
                blobTxn.trackBlob(event.id().toString());
            }
        }
    } finally {
        cleanup.free();
    }
}
