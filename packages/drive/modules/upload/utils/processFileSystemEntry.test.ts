import { EMPTY_FOLDER_PLACEHOLDER_FILE, EMPTY_FOLDER_PLACEHOLDER_MIMETYPE } from '../constants';
import { processFileSystemEntry } from './processFileSystemEntry';

describe('processFileSystemEntry', () => {
    const createMockFile = (name: string): File => {
        return new File([], name, { type: 'text/plain' });
    };

    const createMockFileEntry = (name: string, file: File): FileSystemFileEntry => {
        return {
            isFile: true,
            isDirectory: false,
            name,
            file: (successCallback: (file: File) => void) => {
                successCallback(file);
            },
        } as FileSystemFileEntry;
    };

    const createMockDirectoryEntry = (name: string, entries: FileSystemEntry[]): FileSystemDirectoryEntry => {
        return {
            isFile: false,
            isDirectory: true,
            name,
            createReader: () => {
                let entriesRemaining = [...entries];
                return {
                    readEntries: (successCallback: (entries: FileSystemEntry[]) => void) => {
                        if (entriesRemaining.length > 0) {
                            const currentEntries = entriesRemaining;
                            entriesRemaining = [];
                            successCallback(currentEntries);
                        } else {
                            successCallback([]);
                        }
                    },
                } as FileSystemDirectoryReader;
            },
        } as FileSystemDirectoryEntry;
    };

    it('should process a single file entry', async () => {
        const mockFile = createMockFile('test.txt');
        const fileEntry = createMockFileEntry('test.txt', mockFile);

        const result = await processFileSystemEntry(fileEntry);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('test.txt');
        expect((result[0] as any).webkitRelativePath).toBe('test.txt');
    });

    it('should process a file entry with path prefix', async () => {
        const mockFile = createMockFile('test.txt');
        const fileEntry = createMockFileEntry('test.txt', mockFile);

        const result = await processFileSystemEntry(fileEntry, 'folder/subfolder/');

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('test.txt');
        expect((result[0] as any).webkitRelativePath).toBe('folder/subfolder/test.txt');
    });

    it('should process a directory entry with files', async () => {
        const mockFile1 = createMockFile('file1.txt');
        const mockFile2 = createMockFile('file2.txt');
        const fileEntry1 = createMockFileEntry('file1.txt', mockFile1);
        const fileEntry2 = createMockFileEntry('file2.txt', mockFile2);

        const dirEntry = createMockDirectoryEntry('myFolder', [fileEntry1, fileEntry2]);

        const result = await processFileSystemEntry(dirEntry);

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('file1.txt');
        expect((result[0] as any).webkitRelativePath).toBe('myFolder/file1.txt');
        expect(result[1].name).toBe('file2.txt');
        expect((result[1] as any).webkitRelativePath).toBe('myFolder/file2.txt');
    });

    it('should process nested directory structure', async () => {
        const mockFile1 = createMockFile('file1.txt');
        const mockFile2 = createMockFile('file2.txt');
        const fileEntry1 = createMockFileEntry('file1.txt', mockFile1);
        const fileEntry2 = createMockFileEntry('file2.txt', mockFile2);

        const subDirEntry = createMockDirectoryEntry('subfolder', [fileEntry2]);
        const dirEntry = createMockDirectoryEntry('myFolder', [fileEntry1, subDirEntry]);

        const result = await processFileSystemEntry(dirEntry);

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('file1.txt');
        expect((result[0] as any).webkitRelativePath).toBe('myFolder/file1.txt');
        expect(result[1].name).toBe('file2.txt');
        expect((result[1] as any).webkitRelativePath).toBe('myFolder/subfolder/file2.txt');
    });

    it('should process empty directory with .proton-drive-keep file', async () => {
        const dirEntry = createMockDirectoryEntry('emptyFolder', []);

        const result = await processFileSystemEntry(dirEntry);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe(EMPTY_FOLDER_PLACEHOLDER_FILE);
        expect((result[0] as any).webkitRelativePath).toBe(`emptyFolder/${EMPTY_FOLDER_PLACEHOLDER_FILE}`);
        expect(result[0].type).toBe(EMPTY_FOLDER_PLACEHOLDER_MIMETYPE);
    });

    it('should set webkitRelativePath as non-writable', async () => {
        const mockFile = createMockFile('test.txt');
        const fileEntry = createMockFileEntry('test.txt', mockFile);

        const result = await processFileSystemEntry(fileEntry, 'folder/');

        const descriptor = Object.getOwnPropertyDescriptor(result[0], 'webkitRelativePath');
        expect(descriptor?.writable).toBe(false);
        expect(descriptor?.value).toBe('folder/test.txt');
    });

    it('should handle file entry errors', async () => {
        const fileEntry = {
            isFile: true,
            isDirectory: false,
            name: 'error.txt',
            file: (_successCallback: any, errorCallback: (error: Error) => void) => {
                errorCallback(new Error('File read error'));
            },
        } as FileSystemFileEntry;

        await expect(processFileSystemEntry(fileEntry)).rejects.toThrow('File read error');
    });

    it('should handle directory reader errors', async () => {
        const dirEntry = {
            isFile: false,
            isDirectory: true,
            name: 'errorFolder',
            createReader: () => {
                return {
                    readEntries: (_successCallback: any, errorCallback: (error: Error) => void) => {
                        errorCallback(new Error('Directory read error'));
                    },
                } as FileSystemDirectoryReader;
            },
        } as FileSystemDirectoryEntry;

        await expect(processFileSystemEntry(dirEntry)).rejects.toThrow('Directory read error');
    });
});
