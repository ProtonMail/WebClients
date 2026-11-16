import type * as Comlink from 'comlink';

import { getLatestID } from '@proton/shared/lib/api/events';
import { queryMessageMetadata } from '@proton/shared/lib/api/messages';
import type { MessageMetadata } from '@proton/shared/lib/interfaces/mail/Message';
import chunk from '@proton/utils/chunk';

import type { Anchor } from '../../db/schema';
import type { BodyRequest, EventUpdateResponse, MailApiBridge } from '../MailApiBridge';
import type { MessageCacheContent } from '../MessageCache';

const BODY_BATCH_MAX_MESSAGES = 20;
const METADATA_PAGE_SIZE = BODY_BATCH_MAX_MESSAGES * Math.ceil(50 / BODY_BATCH_MAX_MESSAGES);

function calculateNextAnchor(messages: MessageMetadata[], anchor: Anchor | undefined): Anchor {
    if (messages.length === 0) {
        return { ...(anchor ?? {}), eof: true };
    } else {
        const lastMessage = messages[messages.length - 1];
        return {
            position: {
                time: lastMessage.Time,
                remoteId: lastMessage.ID,
                processed: (anchor?.position?.processed ?? 0) + messages.length,
            },
        };
    }
}

export class IndexApi {
    private nextAbortId = 0;

    constructor(private readonly api: Comlink.Remote<MailApiBridge>) {}

    /**
     * Fetches and decrypts the bodies in batches the API accepts, skipping those already in the cache.
     * Each batch is added to the cache as it arrives, so an aborted call doesn't lose the batches done so far.
     */
    async fetchBodies(
        requests: BodyRequest[],
        bodyCache: Map<string, MessageCacheContent> | undefined,
        abortSignal: AbortSignal
    ): Promise<Map<string, MessageCacheContent>> {
        const bodies = new Map<string, MessageCacheContent>();
        const requestsToFetch: BodyRequest[] = [];
        for (const { ID, AddressID, Flags } of requests) {
            const cached = bodyCache?.get(ID);
            if (cached) {
                bodies.set(ID, cached);
            } else {
                requestsToFetch.push({ ID, AddressID, Flags });
            }
        }
        for (const batch of chunk(requestsToFetch, BODY_BATCH_MAX_MESSAGES)) {
            const decrypted = await this.fetchAndDecryptBatch(batch, abortSignal);
            for (const [id, body] of decrypted) {
                bodies.set(id, body);
                bodyCache?.set(id, body);
            }
        }
        return bodies;
    }

    async fetchMetadataPage(
        anchor: Anchor | undefined,
        abortSignal: AbortSignal
    ): Promise<{ messages: MessageMetadata[]; nextAnchor: Anchor; totalMessages: number }> {
        const metadata = await this.apiWithAbortSignal<{ Messages: MessageMetadata[]; Total: number }>(
            queryMessageMetadata({
                PageSize: METADATA_PAGE_SIZE,
                Page: 0,
                End: anchor?.position?.time,
                EndID: anchor?.position?.remoteId,
                Sort: 'Time',
                Desc: 1,
            }),
            abortSignal
        );
        return {
            messages: metadata.Messages,
            nextAnchor: calculateNextAnchor(metadata.Messages, anchor),
            totalMessages: metadata.Total + (anchor?.position?.processed ?? 0),
        };
    }

    async fetchLatestEventId(abortSignal: AbortSignal): Promise<string | undefined> {
        const response = await this.apiWithAbortSignal<{ EventID?: string }>(getLatestID(), abortSignal);
        return response.EventID;
    }

    async fetchEventUpdate(eventID: string, abortSignal: AbortSignal): Promise<EventUpdateResponse> {
        const { abortId, release } = this.abortSignalToId(abortSignal);
        try {
            return await this.api.fetchEventUpdate(abortId, eventID);
        } catch (err) {
            throw abortSignal.aborted ? abortSignal.reason : err;
        } finally {
            release();
        }
    }

    private async fetchAndDecryptBatch(batch: BodyRequest[], abortSignal: AbortSignal) {
        const { abortId, release } = this.abortSignalToId(abortSignal);
        try {
            return await this.api.fetchAndDecryptBodies(abortId, batch);
        } catch (err) {
            throw abortSignal.aborted ? abortSignal.reason : err;
        } finally {
            release();
        }
    }

    private async apiWithAbortSignal<T>(options: object, abortSignal: AbortSignal): Promise<T> {
        const { abortId, release } = this.abortSignalToId(abortSignal);
        try {
            return (await this.api.request(abortId, options)) as T;
        } catch (err) {
            throw abortSignal.aborted ? abortSignal.reason : err;
        } finally {
            release();
        }
    }

    /**
     * An AbortSignal can't cross postMessage, so a request gets an abortId, which is aborted on the main thread
     * when the signal fires. Call `release` once the request has settled.
     */
    private abortSignalToId(abortSignal: AbortSignal) {
        abortSignal.throwIfAborted();
        const abortId = (this.nextAbortId += 1);
        const onAbort = () => {
            void this.api.abort(abortId);
        };
        abortSignal.addEventListener('abort', onAbort, { once: true });
        return {
            abortId,
            release: () => {
                abortSignal.removeEventListener('abort', onAbort);
            },
        };
    }
}
