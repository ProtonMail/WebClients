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
});
