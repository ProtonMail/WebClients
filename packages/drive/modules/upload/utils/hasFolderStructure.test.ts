import { hasFolderStructure } from './hasFolderStructure';

const createFileWithPath = (name: string, path: string) => {
    const file = new File([''], name);
    Object.defineProperty(file, 'webkitRelativePath', { value: path });
    return file;
};

describe('hasFolderStructure', () => {
    it('should return false for flat files (no folder structure)', () => {
        const files = [createFileWithPath('file1.txt', 'file1.txt'), createFileWithPath('file2.txt', 'file2.txt')];

        expect(hasFolderStructure(files)).toBe(false);
    });

    it('should return false for files with empty webkitRelativePath', () => {
        const files = [createFileWithPath('file1.txt', ''), createFileWithPath('file2.txt', '')];

        expect(hasFolderStructure(files)).toBe(false);
    });

    it('should return true for files in a folder', () => {
        const files = [createFileWithPath('file.txt', 'Folder/file.txt')];

        expect(hasFolderStructure(files)).toBe(true);
    });

    it('should return true for files in nested folders', () => {
        const files = [createFileWithPath('file.txt', 'Folder1/Folder2/file.txt')];

        expect(hasFolderStructure(files)).toBe(true);
    });

    it('should return true if at least one file has folder structure', () => {
        const files = [
            createFileWithPath('file1.txt', 'file1.txt'),
            createFileWithPath('file2.txt', 'Folder/file2.txt'),
        ];

        expect(hasFolderStructure(files)).toBe(true);
    });

    it('should return false for empty array', () => {
        expect(hasFolderStructure([])).toBe(false);
    });

    it('should handle paths with empty segments', () => {
        const files = [createFileWithPath('file.txt', 'Folder//file.txt')];

        expect(hasFolderStructure(files)).toBe(true);
    });

    it('should return false for single segment with trailing slash', () => {
        const files = [createFileWithPath('file.txt', 'file.txt/')];

        expect(hasFolderStructure(files)).toBe(false);
    });
});
