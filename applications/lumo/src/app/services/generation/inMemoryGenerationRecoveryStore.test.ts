import { attachmentDataCache } from '../attachmentDataCache';
import { InMemoryGenerationRecoveryStore } from './inMemoryGenerationRecoveryStore';

it('snapshots request keys and content without persisting or sharing them with a new page store', async () => {
    const open = jest.spyOn(indexedDB, 'open');
    const write = jest.spyOn(Storage.prototype, 'setItem');
    const store = new InMemoryGenerationRecoveryStore();
    const snapshot = { requestKey: 'temporary request key', turns: [{ content: 'private question' }] };
    try {
        await store.save('chat', snapshot, Date.now() + 60_000, 'job');
        snapshot.turns[0].content = 'changed question';
        const restored = await store.get<typeof snapshot>('chat');
        expect(restored).toEqual({ requestKey: 'temporary request key', turns: [{ content: 'private question' }] });
        restored!.turns[0].content = 'changed read';
        expect(await store.get('chat')).toEqual({
            requestKey: 'temporary request key',
            turns: [{ content: 'private question' }],
        });
        expect(await new InMemoryGenerationRecoveryStore().get('chat')).toBeUndefined();
        expect(open).not.toHaveBeenCalled();
        expect(write).not.toHaveBeenCalled();
    } finally {
        jest.restoreAllMocks();
    }
});

it('expires old snapshots and preserves live contents', async () => {
    const store = new InMemoryGenerationRecoveryStore();
    await store.save('expired', { requestKey: 'expired key' }, Date.now() - 1);
    await store.save('live', { answer: 'live answer' }, Date.now() + 60_000);
    expect(await store.get('expired')).toBeUndefined();
    expect(await store.ids()).toEqual(['live']);
    expect(await store.expiredIds()).toEqual(['expired']);
    expect(await store.expiredIds()).toEqual([]);
    expect(await store.get('live')).toEqual({ answer: 'live answer' });
});

it('keeps a new job when cleanup for an older job arrives late', async () => {
    const store = new InMemoryGenerationRecoveryStore();
    await store.save('chat', { answer: 'old answer' }, Date.now() + 60_000, 'old');
    await store.save('chat', { answer: 'new answer' }, Date.now() + 60_000, 'new');
    await store.remove('chat', 'old');
    expect(await store.get('chat')).toEqual({ answer: 'new answer' });
    await store.remove('chat', 'new');
    expect(await store.get('chat')).toBeUndefined();
});

it('clears state and blocks late writes after teardown', async () => {
    const store = new InMemoryGenerationRecoveryStore();
    await store.save('chat', { requestKey: 'temporary key' }, Date.now() + 60_000);
    await store.dispose();
    await expect(store.get('chat')).rejects.toThrow('closed');
    await expect(store.save('late', { answer: 'late answer' }, Date.now() + 60_000)).rejects.toThrow('closed');
});

it('retains guest attachment bytes by reference across checkpoints and releases them after cleanup', async () => {
    const store = new InMemoryGenerationRecoveryStore();
    const bytes = new Uint8Array([11, 22, 33]);
    const pages = [{ page: 1, data: new Uint8Array([44, 55]) }];
    attachmentDataCache.setData('guest-file', bytes);
    attachmentDataCache.setPageImages('guest-file', pages);
    const snapshot = { attachments: [{ attachment: { id: 'guest-file' }, storage: 'memory' }] };
    try {
        await store.save('chat', snapshot, Date.now() + 60_000, 'job', ['guest-file']);
        attachmentDataCache.delete('guest-file');
        expect(attachmentDataCache.getPageImages('guest-file')).toBe(pages);
        const updatedPages = [{ page: 2, data: new Uint8Array([66, 77]) }];
        attachmentDataCache.setPageImages('guest-file', updatedPages);
        attachmentDataCache.delete('guest-file');
        await store.save('chat', snapshot, Date.now() + 60_000, 'job', ['guest-file']);
        expect(attachmentDataCache.getData('guest-file')).toBe(bytes);
        expect(attachmentDataCache.getPageImages('guest-file')).toBe(updatedPages);
        expect(attachmentDataCache.getStats()).toEqual({ size: 1, totalBytes: 5 });
        expect(await store.get('chat')).toEqual(snapshot);
        await store.remove('chat', 'job');
        expect(attachmentDataCache.getData('guest-file')).toBeUndefined();
        expect(attachmentDataCache.getPageImages('guest-file')).toBeUndefined();
    } finally {
        attachmentDataCache.clear();
    }
});
