import { buildAlreadyMentionedNames, filterFiles } from './fileMentionHelpers';
import type { FileItem } from './fileMentionHelpers';

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeFile(name: string): FileItem {
    return { id: name, name, source: 'local' };
}

// ─── buildAlreadyMentionedNames ───────────────────────────────────────────────

describe('buildAlreadyMentionedNames', () => {
    it('returns empty set when no files are mentioned', () => {
        const files = [makeFile('README.txt'), makeFile('report.pdf')];
        const result = buildAlreadyMentionedNames(files, 'just plain text');
        expect(result.size).toBe(0);
    });

    it('returns the name (lowercase) when a file is fully mentioned', () => {
        const files = [makeFile('README.txt')];
        const result = buildAlreadyMentionedNames(files, 'tell me about @README.txt please');
        expect(result.has('readme.txt')).toBe(true);
    });

    it('does NOT treat a partial @ typing as a full mention', () => {
        const files = [makeFile('README.txt')];
        // User is mid-typing — @README only, not @README.txt
        const result = buildAlreadyMentionedNames(files, 'tell me about @README');
        expect(result.size).toBe(0);
    });

    it('handles multiple already-mentioned files', () => {
        const files = [makeFile('report.pdf'), makeFile('notes.txt'), makeFile('data.csv')];
        const value = 'compare @report.pdf and @notes.txt please';
        const result = buildAlreadyMentionedNames(files, value);
        expect(result.has('report.pdf')).toBe(true);
        expect(result.has('notes.txt')).toBe(true);
        expect(result.has('data.csv')).toBe(false);
    });

    it('normalises to lowercase regardless of file name casing', () => {
        const files = [makeFile('Report.PDF')];
        const result = buildAlreadyMentionedNames(files, 'see @Report.PDF for details');
        expect(result.has('report.pdf')).toBe(true);
    });

    it('returns empty set when files list is empty', () => {
        const result = buildAlreadyMentionedNames([], 'tell me about @README.txt');
        expect(result.size).toBe(0);
    });
});

// ─── filterFiles ─────────────────────────────────────────────────────────────

describe('filterFiles', () => {
    const files = [
        makeFile('README.txt'),
        makeFile('report.pdf'),
        makeFile('notes.txt'),
        makeFile('data.csv'),
        makeFile('summary.md'),
    ];

    it('returns all files (up to the limit) when query is empty', () => {
        const result = filterFiles(files, '', 10);
        expect(result).toHaveLength(5);
    });

    it('respects the limit when query is empty', () => {
        const result = filterFiles(files, '', 3);
        expect(result).toHaveLength(3);
    });

    it('filters files by a case-insensitive query', () => {
        const result = filterFiles(files, 'report');
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('report.pdf');
    });

    it('is case-insensitive when matching', () => {
        const result = filterFiles(files, 'README');
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('README.txt');
    });

    it('matches a substring of the filename', () => {
        const result = filterFiles(files, '.txt');
        expect(result.map((f) => f.name)).toEqual(expect.arrayContaining(['README.txt', 'notes.txt']));
    });

    it('returns an empty array when query matches nothing', () => {
        const result = filterFiles(files, 'zzznomatch');
        expect(result).toHaveLength(0);
    });

    it('respects the limit on filtered results', () => {
        // '.txt' matches README.txt and notes.txt (2 files); limit of 1 should cut it
        const result = filterFiles(files, '.txt', 1);
        expect(result).toHaveLength(1);
    });
});

// ─── combined: already-mentioned files are excluded from dropdown ─────────────

describe('already-mentioned files excluded from dropdown', () => {
    const allFiles = [
        makeFile('README.txt'),
        makeFile('report.pdf'),
        makeFile('notes.txt'),
    ];

    function getDropdownFiles(composerValue: string, query: string): FileItem[] {
        const alreadyMentioned = buildAlreadyMentionedNames(allFiles, composerValue);
        return filterFiles(allFiles, query).filter((f) => !alreadyMentioned.has(f.name.toLowerCase()));
    }

    it('shows all files when nothing is mentioned yet', () => {
        const result = getDropdownFiles('', '');
        expect(result).toHaveLength(3);
    });

    it('excludes a file that is already fully @mentioned in the composer', () => {
        const result = getDropdownFiles('@README.txt tell me about it', '');
        const names = result.map((f) => f.name);
        expect(names).not.toContain('README.txt');
        expect(names).toContain('report.pdf');
        expect(names).toContain('notes.txt');
    });

    it('still shows a file while the user is mid-typing (partial mention)', () => {
        // User typed "@README" but hasn't completed "@README.txt" yet
        const result = getDropdownFiles('@README', 'README');
        const names = result.map((f) => f.name);
        expect(names).toContain('README.txt');
    });

    it('excludes multiple already-mentioned files', () => {
        const value = '@README.txt and @report.pdf are both included';
        const result = getDropdownFiles(value, '');
        const names = result.map((f) => f.name);
        expect(names).not.toContain('README.txt');
        expect(names).not.toContain('report.pdf');
        expect(names).toContain('notes.txt');
    });

    it('returns an empty list when all files are already mentioned', () => {
        const value = '@README.txt @report.pdf @notes.txt';
        const result = getDropdownFiles(value, '');
        expect(result).toHaveLength(0);
    });
});
