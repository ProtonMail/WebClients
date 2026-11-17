import { PRIMARY_ONLY_NOTE } from '../../helpers/categories';
import { DefaultFolderReference } from '../../helpers/defaultFolders';
import type { OpenFolderResult } from './openFolder';
import { openFolderDefinition } from './openFolder';

const anyReferences = {} as any;

describe('openFolderDefinition', () => {
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
            primaryOnly: false,
        };
        const out = openFolderDefinition.serializeForLumo(result, anyReferences);
        expect(out).toContain('Opened Archive:');
        expect(out).toContain('email-a1b2c3');
    });

    it('serializes an empty location with a "no emails" note', () => {
        const out = openFolderDefinition.serializeForLumo(
            { location: 'Spam', rows: [], total: 0, bulkActionRunning: false, primaryOnly: false },
            anyReferences
        );
        expect(out).toContain('No emails in Spam.');
        expect(out).not.toContain(PRIMARY_ONLY_NOTE);
    });

    // Reading that as "your Spam is empty" is the failure mode: a mark-all leaves its location unable to
    // load a list at all, so the emptiness is the bulk action, not the mailbox.
    it('says a bulk action was still running rather than calling the location empty', () => {
        const out = openFolderDefinition.serializeForLumo(
            { location: 'Inbox', rows: [], total: 0, bulkActionRunning: true, primaryOnly: false },
            anyReferences
        );
        expect(out).not.toContain('No emails in Inbox.');
        expect(out).toContain('bulk action was still running');
    });

    // Mail lands a bare Inbox open on Primary, so without this an email missing there reads as "not in the Inbox".
    it('says an Inbox opened with no tab covered only the Primary tab', () => {
        const out = openFolderDefinition.serializeForLumo(
            { location: 'Inbox', rows: [], total: 0, bulkActionRunning: false, primaryOnly: true },
            anyReferences
        );
        expect(out).toContain(PRIMARY_ONLY_NOTE);
    });

    it('names every default folder in its description', () => {
        Object.values(DefaultFolderReference).forEach((reference) => {
            expect(openFolderDefinition.toolDescription).toContain(reference);
        });
    });

    it('summarizes the chip with the opened location name', () => {
        const chip = openFolderDefinition.summarizeChip(
            { target: DefaultFolderReference.ARCHIVE, category: null, filter: null, sort: null },
            { location: 'Archive', rows: [], total: 0, bulkActionRunning: false, primaryOnly: false }
        );
        expect(chip.label).toContain('Archive');
    });
});
