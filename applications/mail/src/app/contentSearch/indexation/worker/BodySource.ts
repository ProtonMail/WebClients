import type { ESBaseMessage } from '../../../models/encryptedSearch';
import type { MessageCacheContent, OpenMessageCacheTransaction } from '../MessageCache';
import type { IndexApi } from './IndexApi';

/** fetches and decrypts message bodies and queues them for the message cache,
so this logic isn't duplicated across all index tasks  */
export class BodySource {
    constructor(private readonly api: IndexApi) {}

    /** returns the decrypted bodies, and queues the messages to be added in messageCacheTxn */
    async getBodiesForMetadata(
        metadatas: ESBaseMessage[],
        messageCacheTxn: OpenMessageCacheTransaction,
        abortSignal: AbortSignal,
        bodyCache: Map<string, MessageCacheContent> | undefined = undefined
    ): Promise<Map<string, string>> {
        const decryptedBodies = await this.api.fetchBodies(metadatas, bodyCache, abortSignal);
        for (const m of metadatas) {
            const body = decryptedBodies.get(m.ID);
            if (body) {
                messageCacheTxn.addMessage({
                    ...m,
                    decryptedBody: body.decryptedBody,
                    decryptedSubject: body.decryptedSubject,
                    mimeType: body.mimeType,
                });
            }
        }
        return new Map(decryptedBodies.entries().map(([key, value]) => [key, value.decryptedBody]));
    }
}
