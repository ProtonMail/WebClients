import type { Attachment } from '../types';
import { countAttachmentToken } from './utils';

const attachment = (overrides: Partial<Attachment>): Attachment =>
    ({ filename: 'doc.md', processing: false, ...overrides }) as unknown as Attachment;

describe('countAttachmentToken', () => {
    it('uses the cached token count even when markdown is not loaded (shallow attachment)', () => {
        // Historical/shallow attachments keep tokenCount but drop markdown.
        const att = attachment({ tokenCount: 4200, markdown: undefined });
        expect(countAttachmentToken(att)).toBe(4200);
    });

    it('falls back to estimating from markdown when no cached count exists', () => {
        const att = attachment({ tokenCount: undefined, markdown: 'hello world content' });
        expect(countAttachmentToken(att)).toBeGreaterThan(0);
    });

    it('returns 0 while processing or with neither markdown nor cached count', () => {
        expect(countAttachmentToken(attachment({ processing: true, tokenCount: 999 }))).toBe(0);
        expect(countAttachmentToken(attachment({ tokenCount: undefined, markdown: undefined }))).toBe(0);
    });
});
