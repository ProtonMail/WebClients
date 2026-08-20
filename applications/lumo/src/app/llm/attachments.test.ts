import type { Message } from '../types';
import { Role } from '../types';
import { MAX_IMAGES_PER_REQUEST, getImageLimitInfo } from './attachments';

describe('getImageLimitInfo — compaction interaction', () => {
    const makeImageMessage = (id: string, messageId = `msg-${id}`): Message =>
        ({
            id: messageId,
            role: Role.User,
            content: 'describe this',
            conversationId: 'conv-1',
            attachments: [{ id, filename: `${id}.png`, mimeType: 'image/png' }],
        }) as unknown as Message;

    // A compaction boundary marker that summarizes the given message ids.
    const makeCompactionMessage = (summarizedMessageIds: string[], messageId = 'compaction-1'): Message =>
        ({
            id: messageId,
            role: Role.Assistant,
            content: '',
            conversationId: 'conv-1',
            compaction: {
                status: 'done',
                summary: 'Earlier messages were condensed.',
                summarizedMessageIds,
                keptMessageIds: [],
                stats: {} as any,
                createdAt: new Date().toISOString(),
            },
        }) as unknown as Message;

    it('does not flag the limit when images only exceed it across compacted messages', () => {
        // More than the limit of images in total, but the oldest ones are summarized away.
        const ids = Array.from({ length: MAX_IMAGES_PER_REQUEST + 3 }, (_, i) => `img-${i}`);
        const messages = ids.map((id) => makeImageMessage(id));

        // Summarize enough of the oldest images to drop below the limit.
        const summarizedIds = messages.slice(0, 5).map((m) => m.id);
        const chain: Message[] = [makeCompactionMessage(summarizedIds), ...messages];

        const info = getImageLimitInfo(chain);

        // After compaction only MAX_IMAGES_PER_REQUEST + 3 - 5 images remain.
        expect(info.totalImages).toBe(MAX_IMAGES_PER_REQUEST + 3 - 5);
        expect(info.exceedsLimit).toBe(false);
        expect(info.excludedImageIds.size).toBe(0);
    });

    it('still flags the limit when enough images remain after compaction', () => {
        const ids = Array.from({ length: MAX_IMAGES_PER_REQUEST + 3 }, (_, i) => `img-${i}`);
        const messages = ids.map((id) => makeImageMessage(id));

        // Only summarize one of the oldest images — still above the limit.
        const summarizedIds = [messages[0].id];
        const chain: Message[] = [makeCompactionMessage(summarizedIds), ...messages];

        const info = getImageLimitInfo(chain);

        expect(info.totalImages).toBe(MAX_IMAGES_PER_REQUEST + 2);
        expect(info.exceedsLimit).toBe(true);
        // The summarized image must not appear among kept or excluded ids.
        expect(info.keptImageIds.has('img-0')).toBe(false);
        expect(info.excludedImageIds.has('img-0')).toBe(false);
        // The most recent MAX_IMAGES_PER_REQUEST surviving images are kept.
        expect(info.keptImageIds.size).toBe(MAX_IMAGES_PER_REQUEST);
        expect([...info.keptImageIds]).toEqual(ids.slice(-MAX_IMAGES_PER_REQUEST));
    });

    it('counts all images when there is no compaction boundary', () => {
        const ids = Array.from({ length: MAX_IMAGES_PER_REQUEST + 1 }, (_, i) => `img-${i}`);
        const chain = ids.map((id) => makeImageMessage(id));

        const info = getImageLimitInfo(chain);

        expect(info.totalImages).toBe(MAX_IMAGES_PER_REQUEST + 1);
        expect(info.exceedsLimit).toBe(true);
        expect(info.excludedImageIds.has('img-0')).toBe(true);
    });
});
