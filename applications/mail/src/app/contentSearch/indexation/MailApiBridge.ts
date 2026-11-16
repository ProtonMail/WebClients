import { getMessagesBatch } from '@proton/shared/lib/api/messages';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { BatchMessage, MessageMetadata } from '@proton/shared/lib/interfaces/mail/Message';

import { AsyncAbort } from '../utils/AsyncAbort';
import type { Logger } from '../utils/logger';
import type { MessageCacheContent } from './MessageCache';

/** the metadata needed to fetch and decrypt a body, kept minimal as it crosses the worker boundary */
export type BodyRequest = Pick<MessageMetadata, 'ID' | 'AddressID' | 'Flags'>;
export type BatchMessageDecryptionFunction = (
    batchMessage: BatchMessage,
    messageMetadata: BodyRequest
) => Promise<MessageCacheContent>;

/**
 * The index worker's route to the API: the main thread's api instance, proxied as-is, so the worker
 * calls whatever route it needs — `api(queryMessageMetadata(...))`, same shape as anywhere else.
 * Keeping the single api instance on the main thread
 * is what leaves session refresh, human verification, missing scopes and logout owned by it, instead
 * of duplicated (and raced) by a second instance in the worker.
 *
 * Bodies are fetched and decrypted in one call, as the decryption keys live on the main thread too:
 * that way the encrypted bodies never cross the worker boundary, only the decrypted content does.
 *
 * An AbortSignal can't cross postMessage, so the worker tags each request with an abortId and aborts it by
 * that abortId. Messages on a port arrive in order, so an `abort(abortId)` never overtakes its `request(abortId)`.
 */
export class MailApiBridge {
    private readonly inflight = new Map<number, AbortController>();

    constructor(
        private readonly api: Api,
        private readonly decryptBody: BatchMessageDecryptionFunction,
        private readonly logger: Logger
    ) {}

    /**
     * Runs any api route for the worker, silenced and at the lowest priority (see `silentRequest`).
     * Use for requests that need nothing else from the main thread; see `fetchAndDecryptBodies` for one that does.
     */
    async request<T = any>(abortId: number, config: object): Promise<T> {
        const signal = this.abortIdToSignal(abortId);
        try {
            return await this.silentRequest<T>(config, signal);
        } finally {
            this.releaseAbortId(abortId);
        }
    }

    /**
     * Fetches the bodies in a single batch request, so the caller must respect the batch size limit of the API.
     * Bodies that can't be fetched or decrypted are logged and left out of the result.
     * Aborting covers the whole call, including decryption.
     *
     * Decryption is started here rather than in the index worker because the keys are only available here:
     * `getMessageKeys` reads them from the main thread's store, and they are references into the key store of
     * the `CryptoProxy` worker pool the main thread set up. Giving the index worker its own crypto setup would mean
     * exporting the decrypted private keys to it. The OpenPGP work itself still runs off the main thread, in that
     * worker pool (except in browsers without module worker support, see `setupCryptoWorker`); only the
     * orchestration happens here.
     */
    async fetchAndDecryptBodies(abortId: number, requests: BodyRequest[]): Promise<Map<string, MessageCacheContent>> {
        const signal = this.abortIdToSignal(abortId);
        try {
            const decryptableRequests = this.filterDecryptable(requests);
            if (decryptableRequests.length === 0) {
                return new Map();
            }
            const ids = decryptableRequests.map((r) => r.ID);
            const response = await this.silentRequest<{ Messages: BatchMessage[] }>(getMessagesBatch(ids), signal);
            this.logMissingBodies(ids, response.Messages);
            const requestsById = new Map(decryptableRequests.map((r) => [r.ID, r]));
            const decrypted = await this.decryptAbortable(response.Messages, requestsById, signal);
            return new Map(
                decrypted
                    .map(({ id, body }) => {
                        return body ? ([id, body] as const) : undefined;
                    })
                    .filter((entry) => entry !== undefined)
            );
        } finally {
            this.releaseAbortId(abortId);
        }
    }

    abort(abortId: number): void {
        this.inflight.get(abortId)?.abort();
    }

    private abortIdToSignal(abortId: number): AbortSignal {
        const controller = new AbortController();
        this.inflight.set(abortId, controller);
        return controller.signal;
    }

    private releaseAbortId(abortId: number) {
        this.inflight.delete(abortId);
    }

    private silentRequest<T>(config: object, signal: AbortSignal): Promise<T> {
        const { headers, ...rest } = config as { headers?: Record<string, string> };
        return this.api<T>({
            // Indexing happens behind the user's back: no error notification for a failed batch, and
            // the lowest priority so it can't jail their interactive requests. Same treatment v1
            // gives its calls in `apiHelper`.
            silence: true,
            signal,
            ...rest,
            headers: { Priority: 'u=7', ...headers },
        });
    }

    private filterDecryptable(requests: BodyRequest[]) {
        return requests.filter((r) => {
            if (!r.AddressID) {
                this.logger.error(`Indexing skipping body of ${r.ID}: no address id on metadata`);
                return false;
            }
            return true;
        });
    }

    /** decryption can't be cancelled, so on abort this rejects right away and its result is discarded */
    private async decryptAbortable(
        messages: BatchMessage[],
        requestsById: Map<string, BodyRequest>,
        signal: AbortSignal
    ) {
        const asyncAbort = new AsyncAbort([signal]);
        try {
            const decryption = Promise.all(
                messages.map(async (message) => {
                    return { id: message.ID, body: await this.tryDecrypt(message, requestsById.get(message.ID)) };
                })
            );
            return await Promise.race([decryption, asyncAbort.promise]);
        } finally {
            asyncAbort.dispose();
        }
    }

    private async tryDecrypt(message: BatchMessage, request: BodyRequest | undefined) {
        if (!request) {
            this.logger.error(`Indexing skipping body of ${message.ID}: not requested`);
            return undefined;
        }
        try {
            return await this.decryptBody(message, request);
        } catch (err) {
            this.logger.error(`Indexing skipping body of ${message.ID}: failed decryption: ${err}`);
            return undefined;
        }
    }

    private logMissingBodies(requestedIds: string[], messages: BatchMessage[]) {
        const returnedIds = new Set(messages.map((m) => m.ID));
        for (const id of requestedIds) {
            if (!returnedIds.has(id)) {
                this.logger.error(`Indexing skipping body of ${id}: not returned by batch API`);
            }
        }
    }
}
