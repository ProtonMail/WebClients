import type { LibraryCreationEntry } from './libraryCreations';
import { filterAndSortCreations, getLibraryFormatLabel } from './libraryCreations';

const entry = (
    localId: string,
    createdAt: string,
    overrides: Partial<LibraryCreationEntry> = {}
): LibraryCreationEntry => {
    return {
        item: { localId, localSpaceId: 'space', remoteId: `remote-${localId}`, createdAt: new Date(createdAt) },
        title: '',
        ...overrides,
    };
};

const entries: LibraryCreationEntry[] = [
    entry('memo', '2026-10-12T14:09:00Z', {
        title: 'Password Manager Memo',
        artifactType: 'document',
        conversationTitle: 'Proton Pass Pricing',
    }),
    entry('calc', '2026-10-12T14:10:00Z', { title: 'Team Cost Calculator', artifactType: 'code' }),
    entry('landing', '2026-10-03T09:41:00Z', {
        title: 'Launch landing page',
        artifactType: 'webpage',
        conversationTitle: 'Q1 Strategy plan',
    }),
    entry('pending', '2026-10-01T09:00:00Z'),
];

const ids = (list: LibraryCreationEntry[]) => {
    return list.map((item) => {
        return item.item.localId;
    });
};

describe('filterAndSortCreations', () => {
    it('sorts newest first', () => {
        expect(ids(filterAndSortCreations(entries, { filter: 'all', query: '' }))).toEqual([
            'calc',
            'memo',
            'landing',
            'pending',
        ]);
    });

    it('filters by type, leaving out entries that are still decrypting', () => {
        expect(ids(filterAndSortCreations(entries, { filter: 'code', query: '' }))).toEqual(['calc']);
    });

    it('searches titles and chat names, ignoring case', () => {
        expect(ids(filterAndSortCreations(entries, { filter: 'all', query: 'MEMO' }))).toEqual(['memo']);
        expect(ids(filterAndSortCreations(entries, { filter: 'all', query: 'strategy' }))).toEqual(['landing']);
    });
});

describe('getLibraryFormatLabel', () => {
    it('names the stored format from the file extension', () => {
        expect(getLibraryFormatLabel('Memo.md')).toBe('Markdown');
        expect(getLibraryFormatLabel('calc.ts')).toBe('TypeScript');
        expect(getLibraryFormatLabel('page.html')).toBe('HTML');
        expect(getLibraryFormatLabel('script.zig')).toBe('ZIG');
        expect(getLibraryFormatLabel('creation-123')).toBeUndefined();
    });
});
