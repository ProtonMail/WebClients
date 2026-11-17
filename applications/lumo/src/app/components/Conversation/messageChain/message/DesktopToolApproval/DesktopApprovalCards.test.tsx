import { reasonText } from './DesktopApprovalCards';

describe('reasonText', () => {
    it('explains invisible characters instead of claiming data may be sent', () => {
        const text = reasonText({ kind: 'hidden_text', sources: [] });
        expect(text).toContain('invisible characters');
        expect(text).not.toContain('send data to');
    });

    it('names connected apps and hand-added connectors among what was read', () => {
        const text = reasonText({ kind: 'untrusted_content', sources: ['service', 'connector'] });
        expect(text).toContain('messages and documents from connected apps');
        expect(text).toContain('tool descriptions from a connector you added');
    });

    it('falls back to generic wording for a source a newer desktop build sends', () => {
        const sources = ['future'] as unknown as ['mail'];
        expect(reasonText({ kind: 'untrusted_write', sources })).toContain('content from outside sources');
    });
});
