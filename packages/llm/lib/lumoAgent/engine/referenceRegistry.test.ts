import { createReferenceRegistry } from './referenceRegistry';

describe('createReferenceRegistry', () => {
    it('keeps the fields a richer mint recorded when a leaner one re-mints the same id', () => {
        const references = createReferenceRegistry();
        references.referenceFor('email', 'ELEMENT_1', {
            title: 'Hotel booking',
            subtitle: 'Alice',
            meta: '2026-07-29T09:00:00Z',
        });

        const reference = references.referenceFor('email', 'ELEMENT_1', { title: 'Hotel booking' });

        expect(references.labelFor(reference)).toEqual({
            title: 'Hotel booking',
            subtitle: 'Alice',
            meta: '2026-07-29T09:00:00Z',
        });
    });

    it('takes the newer value for a field both mints supply', () => {
        const references = createReferenceRegistry();
        references.referenceFor('folder', 'FOLDER_1', { title: 'Travel' });

        const reference = references.referenceFor('folder', 'FOLDER_1', { title: 'Holidays' });

        expect(references.labelFor(reference)?.title).toBe('Holidays');
    });

    // A confirm card holds the label it was shown, so a rename's tile still reads "old → new".
    it('leaves a label read before a re-mint unchanged', () => {
        const references = createReferenceRegistry();
        const reference = references.referenceFor('folder', 'FOLDER_1', { title: 'Travel' });
        const shownOnCard = references.labelFor(reference);

        references.referenceFor('folder', 'FOLDER_1', { title: 'Holidays' });

        expect(shownOnCard?.title).toBe('Travel');
    });

    describe('with fixed references', () => {
        const INBOX = { reference: 'folder-inbox', id: '0', label: { title: 'Inbox' } };

        it('issues them before any read', () => {
            const references = createReferenceRegistry([INBOX]);

            expect(references.has('folder-inbox')).toBe(true);
            expect(references.idFor('folder-inbox')).toBe('0');
            expect(references.labelFor('folder-inbox')).toEqual({ title: 'Inbox' });
        });

        it('returns the fixed reference when a read meets the same id', () => {
            const references = createReferenceRegistry([INBOX]);

            expect(references.referenceFor('folder', '0')).toBe('folder-inbox');
        });
    });
});
