import { LocalFlagsDb } from './localFlagsDb';

describe('LocalFlagsDb message limit flags', () => {
    it('persists flags across instances for the same user', async () => {
        await new LocalFlagsDb('user-persist').markMessageLimitReached('conv-1');

        const reopened = new LocalFlagsDb('user-persist');
        expect(await reopened.getMessageLimitReachedConversationIds()).toEqual(['conv-1']);
    });

    it('clears a flag', async () => {
        const db = new LocalFlagsDb('user-clear');
        await db.markMessageLimitReached('conv-1');
        await db.markMessageLimitReached('conv-2');
        await db.clearMessageLimitReached('conv-1');

        expect(await db.getMessageLimitReachedConversationIds()).toEqual(['conv-2']);
    });

    it('keeps flags separate per user', async () => {
        await new LocalFlagsDb('user-a').markMessageLimitReached('conv-a');

        expect(await new LocalFlagsDb('user-b').getMessageLimitReachedConversationIds()).toEqual([]);
    });
});
