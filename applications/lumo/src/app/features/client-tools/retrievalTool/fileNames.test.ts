import { findFilesByName, findMentionedFiles, normalizeFileName } from './fileNames';

const files = [
    { id: 'a', name: 'Q3 Budget_final.xlsx', folderPath: 'Drive/Finance' },
    { id: 'b', name: 'notes.md' },
    { id: 'c', name: 'Q3 Budget_final.xlsx', folderPath: 'Drive/Archive' },
];

describe('normalizeFileName', () => {
    it('ignores case, separators, extension and folders', () => {
        expect(normalizeFileName('Drive/Finance/Q3 Budget_final.xlsx')).toBe('q3 budget final');
        expect(normalizeFileName('q3-budget final')).toBe('q3 budget final');
    });
});

describe('findFilesByName', () => {
    it('narrows same-named files by folder', () => {
        expect(findFilesByName('Finance/Q3 Budget_final.xlsx', files).map((file) => file.id)).toEqual(['a']);
        expect(findFilesByName('q3 budget final', files).map((file) => file.id)).toEqual(['a', 'c']);
    });

    it('falls back to partial names, but not for very short references', () => {
        expect(findFilesByName('budget', files).map((file) => file.id)).toEqual(['a', 'c']);
        expect(findFilesByName('q3', files)).toEqual([]);
    });
});

describe('findMentionedFiles', () => {
    it('finds names with their extension, or multi-word names without it', () => {
        const text = 'See notes.md, and the q3 budget final numbers.';
        expect(findMentionedFiles(text, files, 'none').map((file) => file.id)).toEqual(['a', 'b', 'c']);
    });

    it('ignores one-word names used as ordinary words, and the file itself', () => {
        expect(findMentionedFiles('Some notes about the plan.', files, 'none')).toEqual([]);
        expect(findMentionedFiles('notes.md', files, 'b')).toEqual([]);
    });
});
