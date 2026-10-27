import type { DbApi } from '../../indexedDb/db';
import { ATTACHMENT_STORE, CONVERSATION_STORE, MESSAGE_STORE, REMOTE_ID_STORE, SPACE_STORE } from '../../indexedDb/db';
import { serializeCachedAttachment } from '../../lib/serializeCachedAttachment';
import { ConflictClientError } from '../../redux/sagas/sagaErrors';
import { addConversation, pushConversationRequest } from '../../redux/slices/core/conversations';
import { addIdMapEntry } from '../../redux/slices/core/idmap';
import { addMessage, pushMessageRequest } from '../../redux/slices/core/messages';
import type { LumoStore } from '../../redux/store';
import type { LumoApi } from '../../remote/api';
import { convertNewConversationToApi } from '../../remote/conversion';
import type { RemoteId } from '../../remote/types';
import {
    deserializeConversation,
    deserializeMessage,
    deserializeSpaceWithMasterKeys,
    serializeConversation,
    serializeMessage,
} from '../../serialization';
import type {
    Conversation,
    MasterKeysBundle,
    Message,
    SerializedAttachment,
    SerializedConversation,
    Space,
} from '../../types';
import { getSpaceDek } from '../../types';
import { buildMasterKeyContext } from '../../util/masterKeys';
import { attachmentDataCache } from '../attachmentDataCache';
import { SchedulePersistenceError } from './types';

export type ScheduleAppStore = Pick<LumoStore, 'getState' | 'dispatch' | 'subscribe'>;

function transactionDone(tx: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onabort = tx.onerror = () => reject(tx.error ?? new Error('Schedule transaction aborted'));
    });
}

/** Persists schedules through the application's encrypted space, conversation and message stores. */
export class ScheduleStorage {
    constructor(
        readonly db: DbApi,
        readonly store: ScheduleAppStore,
        private readonly keys: MasterKeysBundle,
        readonly isCurrentAccount: () => boolean,
        private readonly reservationApi: Pick<LumoApi, 'postConversation'>
    ) {}

    guard() {
        if (!this.isCurrentAccount()) throw new DOMException('Schedule account is no longer active', 'AbortError');
    }

    async getSpace(id: string): Promise<Space | undefined> {
        this.guard();
        const record = await this.db.getSpaceById(id);
        if (!record || record.deleted) return undefined;
        const { space } = await deserializeSpaceWithMasterKeys(record, await buildMasterKeyContext(this.keys));
        this.guard();
        if (!space) throw new SchedulePersistenceError('Cannot decrypt schedule space');
        return space;
    }

    async readConversation(id: string): Promise<{ raw?: SerializedConversation; conversation?: Conversation }> {
        this.guard();
        const raw = await this.db.getConversationById(id);
        if (!raw) return {};
        if (raw.deleted) return { raw };
        const space = await this.getSpace(raw.spaceId);
        if (!space) throw new SchedulePersistenceError('Schedule space is unavailable');
        const conversation = await deserializeConversation(raw, await getSpaceDek(space));
        this.guard();
        if (!conversation) throw new SchedulePersistenceError('Cannot decrypt schedule conversation');
        return { raw, conversation };
    }

    /** Only the successful server insert grants permission to execute an occurrence. */
    async reserveConversation(conversation: Conversation): Promise<boolean> {
        this.guard();
        const space = await this.getSpace(conversation.spaceId);
        if (!space) return false;
        const remoteSpaceId = await this.db.getRemoteIdFromLocalId('space', space.id);
        if (!remoteSpaceId) throw new SchedulePersistenceError('Schedule space has not synced yet');
        const record = await serializeConversation(conversation, await getSpaceDek(space));
        this.guard();
        let remoteId: RemoteId | null;
        try {
            remoteId = await this.reservationApi.postConversation(
                convertNewConversationToApi(record, remoteSpaceId),
                'urgent'
            );
        } catch (error) {
            if (error instanceof ConflictClientError) return false;
            // A lost response is uncertain: never execute without a confirmed creation.
            throw error;
        }
        this.guard();
        if (!remoteId) throw new SchedulePersistenceError('Conversation creation was not confirmed');
        // Event sync may have received our conversation before the POST response.
        for (let attempt = 0; attempt < 5; attempt++) {
            const { raw } = await this.readConversation(conversation.id);
            if (raw?.deleted) return false;
            if (await this.writeConversation(conversation, [], raw, remoteId)) return true;
        }
        throw new SchedulePersistenceError('Could not persist reserved conversation');
    }

    /** Compare-and-write keeps concurrent claims and terminal reports from overwriting one another. */
    async writeConversation(
        conversation: Conversation,
        messages: Message[],
        expected?: SerializedConversation,
        remoteId?: RemoteId
    ): Promise<boolean> {
        this.guard();
        const space = await this.getSpace(conversation.spaceId);
        if (!space) throw new SchedulePersistenceError('Schedule space is unavailable');
        const dek = await getSpaceDek(space);
        const record = { ...(await serializeConversation(conversation, dek)), dirty: !remoteId };
        const messageRecords = await Promise.all(messages.map((message) => serializeMessage(message, dek)));
        if (messageRecords.some((message) => !message)) {
            throw new SchedulePersistenceError('Cannot encrypt run messages');
        }
        const attachmentRecords: SerializedAttachment[] = [];
        const attachmentIds = new Set(messages.flatMap((message) => message.attachments ?? []).map(({ id }) => id));
        for (const id of attachmentIds) {
            const existing = await this.db.getAttachmentById(id);
            if (existing?.deleted) throw new SchedulePersistenceError('Run attachment has been deleted');
            if (existing) continue;
            const attachment = this.store.getState().attachments?.[id];
            if (!attachment || !attachmentDataCache.getData(id)) {
                throw new SchedulePersistenceError('Run attachment data is unavailable');
            }
            const serialized = await serializeCachedAttachment(attachment, dek);
            if (!serialized) throw new SchedulePersistenceError('Cannot encrypt run attachment');
            attachmentRecords.push(serialized);
        }
        this.guard();
        const tx = await this.db.newTransaction(
            [SPACE_STORE, CONVERSATION_STORE, MESSAGE_STORE, REMOTE_ID_STORE, ATTACHMENT_STORE],
            'readwrite'
        );
        const done = transactionDone(tx);
        let written = false;
        const spaceRequest = tx.objectStore(SPACE_STORE).get(space.id);
        spaceRequest.onsuccess = () => {
            if (!spaceRequest.result || spaceRequest.result.deleted) return;
            const conversations = tx.objectStore(CONVERSATION_STORE);
            const request = conversations.get(conversation.id);
            request.onsuccess = () => {
                const current = request.result as SerializedConversation | undefined;
                if (current?.deleted || current?.encrypted !== expected?.encrypted) return;
                conversations.put(record);
                for (const attachment of attachmentRecords) {
                    tx.objectStore(ATTACHMENT_STORE).put({ ...attachment, dirty: true });
                }
                if (remoteId) {
                    tx.objectStore(REMOTE_ID_STORE).put({ type: 'conversation', localId: conversation.id, remoteId });
                }
                for (const message of messageRecords) tx.objectStore(MESSAGE_STORE).put({ ...message!, dirty: true });
                written = true;
            };
        };
        await done;
        this.guard();
        if (written) {
            if (remoteId) {
                this.store.dispatch(
                    addIdMapEntry({ type: 'conversation', localId: conversation.id, remoteId, saveToIdb: false })
                );
            }
            this.store.dispatch(addConversation(conversation));
            for (const message of messages) this.store.dispatch(addMessage(message));
            if (!remoteId) this.store.dispatch(pushConversationRequest({ id: conversation.id }));
            for (const message of messages) this.store.dispatch(pushMessageRequest({ id: message.id }));
        }
        return written;
    }

    async readMessages(conversation: Conversation): Promise<Message[]> {
        const space = await this.getSpace(conversation.spaceId);
        if (!space) throw new SchedulePersistenceError('Schedule space is unavailable');
        const dek = await getSpaceDek(space);
        const records = await this.db.getMessagesByConversationId(conversation.id);
        const messages = await Promise.all(
            records.filter((record) => !record.deleted).map((record) => deserializeMessage(record, dek))
        );
        this.guard();
        if (messages.some((message) => !message)) throw new SchedulePersistenceError('Cannot decrypt run messages');
        return messages as Message[];
    }
}
