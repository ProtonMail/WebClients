import { generateSpaceKeyBase64 } from '../../crypto';
import type { DbApi } from '../../indexedDb/db';
import { serializeCachedAttachment } from '../../lib/serializeCachedAttachment';
import type { Attachment, SerializedAttachment, Space } from '../../types';
import { SpaceType, getSpaceDek } from '../../types';
import { attachmentDataCache } from '../attachmentDataCache';
import { RecoveryAttachmentWriter, restoreRecoveryAttachment } from './recoveryAttachments';

const setup = () => {
    const space: Space = {
        id: 'space',
        spaceKey: generateSpaceKeyBase64(),
        spaceType: SpaceType.Default,
        createdAt: '2026-11-10T00:00:00Z',
        updatedAt: '2026-11-10T00:00:00Z',
    };
    const attachment: Attachment = {
        id: 'file',
        spaceId: space.id,
        filename: 'private.pdf',
        uploadedAt: '2026-11-10T00:00:00Z',
        mimeType: 'application/pdf',
        markdown: 'Private document contents',
    };
    const records = new Map<string, SerializedAttachment>();
    const getAttachmentById = jest.fn(async (id: string) => records.get(id));
    const updateAttachment = jest.fn(async (value: SerializedAttachment, flags: { dirty: boolean }) => {
        records.set(value.id, { ...value, ...flags });
    });
    const dbApi = { getAttachmentById, updateAttachment } as unknown as DbApi;
    return { space, attachment, records, dbApi, getAttachmentById, updateAttachment };
};

afterEach(() => {
    attachmentDataCache.clear();
    jest.restoreAllMocks();
});

it('writes a large attachment once, keeps bytes out of repeated checkpoints, and restores offline', async () => {
    const { space, attachment, records, dbApi, getAttachmentById, updateAttachment } = setup();
    const bytes = new Uint8Array(4 * 1024 * 1024).fill(37);
    const preview = new Uint8Array([3, 7, 11]);
    attachmentDataCache.setData(attachment.id, bytes);
    attachmentDataCache.setImagePreview(attachment.id, preview);
    attachment.pageImages = [{ page: 1, data: new Uint8Array([15, 16]) }];
    const writer = new RecoveryAttachmentWriter(dbApi);
    const first = await writer.capture([attachment], { space });
    expect(await writer.capture([attachment], { space })).toEqual(first);
    expect(getAttachmentById).toHaveBeenCalledTimes(1);
    expect(updateAttachment).toHaveBeenCalledTimes(1);
    expect(first).toEqual([
        {
            attachment: expect.not.objectContaining({ data: expect.anything(), markdown: expect.anything() }),
            storage: 'account',
            spaceKey: space.spaceKey,
        },
    ]);
    expect(first[0].attachment).not.toHaveProperty('pageImages');
    expect(JSON.stringify(first).length).toBeLessThan(600);
    expect(records.get(attachment.id)?.encrypted).toEqual(expect.any(String));
    attachmentDataCache.clear();
    const restored = await restoreRecoveryAttachment(first[0], dbApi);
    expect(restored).toMatchObject({
        id: attachment.id,
        filename: 'private.pdf',
        markdown: 'Private document contents',
    });
    expect(attachmentDataCache.getData(attachment.id)).toEqual(bytes);
    expect(attachmentDataCache.getImagePreview(attachment.id)).toEqual(preview);
});

it('reuses complete encrypted attachments and saves a changed binary revision once', async () => {
    const { space, attachment, records, dbApi, updateAttachment } = setup();
    attachmentDataCache.setData(attachment.id, new Uint8Array([1, 2, 3]));
    records.set(attachment.id, (await serializeCachedAttachment(attachment, await getSpaceDek(space)))!);
    const writer = new RecoveryAttachmentWriter(dbApi);
    await writer.capture([attachment], { space });
    expect(updateAttachment).not.toHaveBeenCalled();
    const changed = new Uint8Array([4, 5, 6]);
    attachmentDataCache.setData(attachment.id, changed);
    const snapshot = await writer.capture([attachment], { space });
    await writer.capture([attachment], { space });
    expect(updateAttachment).toHaveBeenCalledTimes(1);
    attachmentDataCache.clear();
    await restoreRecoveryAttachment(snapshot[0], dbApi);
    expect(attachmentDataCache.getData(attachment.id)).toEqual(changed);
});

it('waits for pending local attachment writes and propagates quota failures', async () => {
    const { space, attachment, dbApi, updateAttachment } = setup();
    const gate = Promise.withResolvers<void>();
    const started = Promise.withResolvers<void>();
    updateAttachment.mockImplementationOnce(async () => {
        started.resolve();
        await gate.promise;
    });
    attachmentDataCache.setData(attachment.id, new Uint8Array([9, 8, 7]));
    let finished = false;
    const saving = new RecoveryAttachmentWriter(dbApi).capture([attachment], { space }).then((value) => {
        finished = true;
        return value;
    });
    await started.promise;
    expect(finished).toBe(false);
    gate.resolve();
    expect(await saving).toMatchObject([{ storage: 'account', attachment: { id: attachment.id } }]);
    const quota = new DOMException('Disk full', 'QuotaExceededError');
    updateAttachment.mockRejectedValueOnce(quota);
    await expect(new RecoveryAttachmentWriter(dbApi).capture([attachment], { space })).rejects.toBe(quota);
});

it('keeps guests in the existing memory cache and still restores legacy inline snapshots', async () => {
    const { attachment } = setup();
    const bytes = new Uint8Array([12, 34, 56]);
    attachment.pageImages = [{ page: 1, data: new Uint8Array([78, 90]) }];
    attachmentDataCache.setData(attachment.id, bytes);
    const snapshot = await new RecoveryAttachmentWriter().capture([attachment], {});
    const { pageImages, ...metadata } = attachment;
    expect(snapshot).toEqual([{ attachment: metadata, storage: 'memory' }]);
    expect(attachmentDataCache.getPageImages(attachment.id)).toBe(pageImages);
    expect(attachmentDataCache.getData(attachment.id)).toBe(bytes);
    expect(await restoreRecoveryAttachment({ attachment, data: new Uint8Array([65, 66]).toBase64() })).toEqual(
        metadata
    );
    expect(attachmentDataCache.getData(attachment.id)).toEqual(new Uint8Array([65, 66]));
});

it('rejects missing referenced data rather than resuming a tool with incomplete inputs', async () => {
    const { space, attachment, dbApi } = setup();
    await expect(
        restoreRecoveryAttachment({ attachment, storage: 'account', spaceKey: space.spaceKey }, dbApi)
    ).rejects.toThrow('unavailable locally');
});
