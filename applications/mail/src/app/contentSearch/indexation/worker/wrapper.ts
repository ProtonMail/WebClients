import type { Execution, Engine as FSEngine, Write as FSWrite } from '@proton/proton-foundation-search';
import { Document, type WriteEvent } from '@proton/proton-foundation-search';

import type { ESBaseMessage } from '../../../models/encryptedSearch';
import type { OpenBlobTransaction } from '../../crypto/EncryptedBlobTransaction';
import { cleanup } from '../../engine/cleanup';
import { isLoadEvent, isSaveEvent } from '../../utils/eventTypeGuards';
import type { MailDelegate } from './MailDelegate';

/** wrappers to the foundation-search classes that deal with the interaction with the EncryptedBlobTransaction */

export class WriteWrapper {
    private disposed = false;
    constructor(
        private readonly fsWrite: FSWrite,
        private readonly delegate: MailDelegate
    ) {}

    insertMetadata(metadata: ESBaseMessage) {
        const doc = new Document(metadata.ID);
        this.delegate.stageMetadata(metadata, doc);
        this.fsWrite.insert(doc);
    }

    insertMessage(metadata: ESBaseMessage, body: string | undefined) {
        const doc = new Document(metadata.ID);
        this.delegate.stageMetadata(metadata, doc);
        if (body) {
            this.delegate.stageBody(body, doc);
        }
        this.fsWrite.insert(doc);
    }

    remove(id: string) {
        this.fsWrite.remove(id);
    }

    async execute(blobTxn: OpenBlobTransaction, abortSignal: AbortSignal | undefined = undefined) {
        abortSignal?.throwIfAborted();
        let execution: Execution;
        try {
            execution = this.fsWrite.commit();
        } catch (err) {
            this.fsWrite.free();
            this.disposed = true;
            throw err;
        }
        try {
            let event: WriteEvent | undefined;
            while ((event = execution.next())) {
                abortSignal?.throwIfAborted();
                if (isLoadEvent(event)) {
                    await blobTxn.handleLoadEvent(event);
                } else if (isSaveEvent(event)) {
                    blobTxn.handleSaveEvent(event);
                }
            }
        } finally {
            // whatever fsWrite needs to free is
            // moved into execution by fsWrite.commit()
            execution.free();
            this.disposed = true;
        }
    }

    /** only needs to be called if you didn't call execute */
    dispose() {
        if (!this.disposed) {
            this.fsWrite.free();
            this.disposed = true;
        }
    }
}

export class EngineWrapper {
    constructor(
        private readonly engine: FSEngine,
        private readonly delegate: MailDelegate
    ) {}

    dispose() {
        this.engine.free();
    }

    write() {
        const fsWrite = this.engine.write();
        if (!fsWrite) {
            throw new Error("can't get Write from engine, somebody else is writing?");
        }
        return new WriteWrapper(fsWrite, this.delegate);
    }

    cleanup(txn: OpenBlobTransaction, abortSignal: AbortSignal | undefined = undefined) {
        return cleanup(this.engine, txn, abortSignal);
    }
}
