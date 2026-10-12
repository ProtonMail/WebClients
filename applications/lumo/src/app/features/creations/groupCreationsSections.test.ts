import { getCreationSectionLabel, groupCreationsIntoSections } from './groupCreationsSections';

describe('groupCreationsIntoSections', () => {
    const now = new Date('2025-10-09T12:00:00Z');

    it('groups recent days individually and older items by month', () => {
        const items = [
            {
                localId: 'a',
                localSpaceId: 's',
                remoteId: 'r1',
                createdAt: new Date('2025-10-08T10:00:00Z'),
            },
            {
                localId: 'b',
                localSpaceId: 's',
                remoteId: 'r2',
                createdAt: new Date('2025-10-07T10:00:00Z'),
            },
            {
                localId: 'c',
                localSpaceId: 's',
                remoteId: 'r3',
                createdAt: new Date('2025-10-01T10:00:00Z'),
            },
            {
                localId: 'd',
                localSpaceId: 's',
                remoteId: 'r4',
                createdAt: new Date('2025-09-28T10:00:00Z'),
            },
        ];

        const sections = groupCreationsIntoSections(items, now);

        expect(sections.map((section) => section.label)).toEqual(['Oct 8', 'Oct 7', 'October', 'September']);
        expect(sections[0].items.map((item) => item.localId)).toEqual(['a']);
        expect(sections[2].items.map((item) => item.localId)).toEqual(['c']);
    });

    it('sorts items newest first within each section', () => {
        const items = [
            {
                localId: 'older',
                localSpaceId: 's',
                remoteId: 'r1',
                createdAt: new Date('2025-10-07T08:00:00Z'),
            },
            {
                localId: 'newer',
                localSpaceId: 's',
                remoteId: 'r2',
                createdAt: new Date('2025-10-07T18:00:00Z'),
            },
        ];

        const sections = groupCreationsIntoSections(items, now);
        expect(sections[0].items.map((item) => item.localId)).toEqual(['newer', 'older']);
    });
});

describe('getCreationSectionLabel', () => {
    const now = new Date('2025-10-09T12:00:00Z');

    it('uses day labels for the last week', () => {
        expect(getCreationSectionLabel(new Date('2025-10-07T12:00:00Z'), now)).toBe('Oct 7');
    });

    it('uses month name for older same-year dates', () => {
        expect(getCreationSectionLabel(new Date('2025-09-15T12:00:00Z'), now)).toBe('September');
    });
});
