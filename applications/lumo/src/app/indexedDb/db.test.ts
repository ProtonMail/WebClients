import { Role, type SerializedAttachment, type SerializedMessage } from '../types';
import { DbApi } from './db';

let counter = 0;
const newDb = () => new DbApi(`db-test-${++counter}`);

const attachment = (id: string): SerializedAttachment => ({
    id,
    spaceId: 'space-1',
    uploadedAt: '2026-01-01T00:00:00.000Z',
    encrypted: `payload-${id}`,
});

const message = (id: string): SerializedMessage => ({
    id,
    conversationId: 'conversation-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    role: Role.User,
    encrypted: `payload-${id}`,
});

describe('DbApi.findUnsyncedResources', () => {
    it('returns only the dirty resources', async () => {
        const db = newDb();
        await db.updateAttachment(attachment('attachment-clean'), { dirty: false });
        await db.updateAttachment(attachment('attachment-dirty'), { dirty: true });
        await db.updateMessage(message('message-clean'), { dirty: false });
        await db.updateMessage(message('message-dirty'), { dirty: true });

        const unsynced = await db.findUnsyncedResources();

        expect(Object.keys(unsynced.unsyncedAttachments)).toEqual(['attachment-dirty']);
        expect(unsynced.unsyncedAttachments['attachment-dirty']).toEqual({
            ...attachment('attachment-dirty'),
            dirty: true,
        });
        expect(Object.keys(unsynced.unsyncedMessages)).toEqual(['message-dirty']);
        expect(unsynced.unsyncedConversations).toEqual({});
        expect(unsynced.unsyncedSpaces).toEqual({});
    });

    it('returns empty maps when the stores are empty', async () => {
        const unsynced = await newDb().findUnsyncedResources();

        expect(unsynced).toEqual({
            unsyncedMessages: {},
            unsyncedConversations: {},
            unsyncedSpaces: {},
            unsyncedAttachments: {},
        });
    });
});

describe('DbApi.getAllAttachmentIds', () => {
    it('returns the ids of every stored attachment, soft-deleted ones included', async () => {
        const db = newDb();
        await db.updateAttachment(attachment('attachment-a'), { dirty: false });
        await db.updateAttachment(attachment('attachment-b'), { dirty: true });
        await db.softDeleteAttachment('attachment-b', { dirty: true });

        expect(await db.getAllAttachmentIds()).toEqual(['attachment-a', 'attachment-b']);
    });
});
