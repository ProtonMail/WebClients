import type { OpenFolderResult } from './openFolder';
import { openFolderDefinition, resolveOpenFolderTarget } from './openFolder';

const anyReferences = {} as any;

describe('resolveOpenFolderTarget', () => {
    it('accepts a standard location', () => {
        expect(resolveOpenFolderTarget({ location: 'archive', target: null })).toEqual({ location: 'archive' });
    });

    it('accepts a custom target', () => {
        expect(resolveOpenFolderTarget({ location: null, target: 'folder-x7b2q1' })).toEqual({
            target: 'folder-x7b2q1',
        });
    });

    it('rejects when both location and target are set', () => {
        expect(() => resolveOpenFolderTarget({ location: 'inbox', target: 'folder-x7b2q1' })).toThrow(/EXACTLY ONE/);
    });

    it('rejects when neither is set', () => {
        expect(() => resolveOpenFolderTarget({ location: null, target: null })).toThrow(/EXACTLY ONE/);
    });

    it('rejects an unknown standard location', () => {
        expect(() => resolveOpenFolderTarget({ location: 'outbox', target: null })).toThrow(/Unknown location/);
    });
});

describe('openFolderDefinition', () => {
    it('is a read with a closed, $ref-free schema over the documented params', () => {
        expect(openFolderDefinition.kind).toBe('read');
        expect(openFolderDefinition.paramsSchema.additionalProperties).toBe(false);
        expect(openFolderDefinition.paramsSchema.required).toEqual(['location', 'target', 'filter', 'sort']);
        expect(Object.keys(openFolderDefinition.paramsSchema.properties)).toEqual([
            'location',
            'target',
            'filter',
            'sort',
        ]);
    });

    it('ships few-shot examples for its documented shapes', () => {
        expect(openFolderDefinition.examples?.length).toBeGreaterThanOrEqual(3);
    });

    it('serializes rows under an "Opened <location>" header', () => {
        const result: OpenFolderResult = {
            location: 'Archive',
            rows: [
                {
                    reference: 'email-a1b2c3',
                    from: 'Al',
                    subject: 'Hi',
                    date: '2026-07-01',
                    unread: true,
                    starred: false,
                    folder: 'Archive',
                    labels: [],
                    hasAttachment: false,
                },
            ],
            total: 1,
            bulkActionRunning: false,
        };
        const out = openFolderDefinition.serializeForLumo(result, anyReferences);
        expect(out).toContain('Opened Archive:');
        expect(out).toContain('email-a1b2c3');
    });

    it('serializes an empty location with a "no emails" note', () => {
        const out = openFolderDefinition.serializeForLumo(
            { location: 'Spam', rows: [], total: 0, bulkActionRunning: false },
            anyReferences
        );
        expect(out).toContain('No emails in Spam.');
    });

    // Reading that as "your Spam is empty" is the failure mode: a mark-all leaves its location unable to
    // load a list at all, so the emptiness is the bulk action, not the mailbox.
    it('says a bulk action is still running rather than calling the location empty', () => {
        const out = openFolderDefinition.serializeForLumo(
            { location: 'Inbox', rows: [], total: 0, bulkActionRunning: true },
            anyReferences
        );
        expect(out).not.toContain('No emails in Inbox.');
        expect(out).toContain('bulk action is still running');
    });

    it('summarizes the chip with the opened location name', () => {
        const chip = openFolderDefinition.summarizeChip(
            { location: 'archive', target: null, filter: null, sort: null },
            { location: 'Archive', rows: [], total: 0, bulkActionRunning: false }
        );
        expect(chip.label).toContain('Archive');
    });
});
