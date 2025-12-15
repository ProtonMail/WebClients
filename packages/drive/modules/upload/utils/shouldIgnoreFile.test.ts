import { EMPTY_FOLDER_PLACEHOLDER_FILE } from '../constants';
import { filterIgnoredFiles, shouldIgnoreFile } from './shouldIgnoreFile';

describe('shouldIgnoreFile', () => {
    it('should ignore default system files', () => {
        expect(shouldIgnoreFile(new File([''], '.DS_Store'))).toBe(true);
        expect(shouldIgnoreFile(new File([''], 'Thumbs.db'))).toBe(true);
        expect(shouldIgnoreFile(new File([''], 'desktop.ini'))).toBe(true);
        expect(shouldIgnoreFile(new File([''], EMPTY_FOLDER_PLACEHOLDER_FILE))).toBe(true);
    });

    it('should not ignore regular files', () => {
        expect(shouldIgnoreFile(new File([''], 'document.txt'))).toBe(false);
        expect(shouldIgnoreFile(new File([''], 'photo.jpg'))).toBe(false);
    });

    it('should ignore files in __MACOSX folders', () => {
        const createFileWithPath = (path: string, name: string) => {
            const file = new File([''], name);
            Object.defineProperty(file, 'webkitRelativePath', { value: path });
            return file;
        };

        expect(shouldIgnoreFile(createFileWithPath('__MACOSX/file.txt', 'file.txt'))).toBe(true);
        expect(shouldIgnoreFile(createFileWithPath('folder/__MACOSX/file.txt', 'file.txt'))).toBe(true);
        expect(shouldIgnoreFile(createFileWithPath('a/b/__MACOSX/file.txt', 'file.txt'))).toBe(true);
    });

    it('should support custom ignore patterns', () => {
        const file = new File([''], 'test.txt');
        expect(shouldIgnoreFile(file, ['test.txt'])).toBe(true);
        expect(shouldIgnoreFile(file, ['other.txt'])).toBe(false);
        expect(shouldIgnoreFile(file, [])).toBe(false);

        // With custom patterns empty folder placeholder should still be ignored
        const keepFile = new File([''], EMPTY_FOLDER_PLACEHOLDER_FILE);
        expect(shouldIgnoreFile(keepFile, ['test.txt'])).toBe(true);
    });
});

describe('filterIgnoredFiles', () => {
    it('should filter out system files', () => {
        const files = [
            new File([''], 'document.txt'),
            new File([''], '.DS_Store'),
            new File([''], 'photo.jpg'),
            new File([''], 'Thumbs.db'),
        ];

        const filtered = filterIgnoredFiles(files);

        expect(filtered).toHaveLength(2);
        expect(filtered.map((f) => f.name)).toEqual(['document.txt', 'photo.jpg']);
    });

    it('should filter out files in __MACOSX folders', () => {
        const createFileWithPath = (name: string, path: string) => {
            const file = new File([''], name);
            Object.defineProperty(file, 'webkitRelativePath', { value: path });
            return file;
        };

        const files = [
            createFileWithPath('document.txt', 'folder/document.txt'),
            createFileWithPath('ignored.txt', 'folder/__MACOSX/ignored.txt'),
        ];

        const filtered = filterIgnoredFiles(files);
        expect(filtered).toHaveLength(1);
        expect(filtered[0].name).toBe('document.txt');
    });

    it('should handle empty arrays and edge cases', () => {
        expect(filterIgnoredFiles([])).toHaveLength(0);
        expect(filterIgnoredFiles([new File([''], '.DS_Store'), new File([''], 'Thumbs.db')])).toHaveLength(0);
    });

    it('should filter out .keep placeholder files for empty directories', () => {
        const createFileWithPath = (name: string, path: string) => {
            const file = new File([''], name);
            Object.defineProperty(file, 'webkitRelativePath', { value: path });
            return file;
        };

        const files = [
            createFileWithPath('document.txt', 'folder/document.txt'),
            createFileWithPath(EMPTY_FOLDER_PLACEHOLDER_FILE, `emptyFolder/${EMPTY_FOLDER_PLACEHOLDER_FILE}`),
            createFileWithPath('data.json', 'folder/data.json'),
        ];

        const filtered = filterIgnoredFiles(files);
        expect(filtered).toHaveLength(2);
        expect(filtered.map((f) => f.name)).toEqual(['document.txt', 'data.json']);
    });
});
