import { processDroppedItems } from './processDroppedItems';

describe('processDroppedItems', () => {
    const createFile = (name: string): File => {
        return new File(['content'], name, { type: 'text/plain' });
    };

    const createFileEntry = (name: string, file: File): FileSystemFileEntry => {
        return {
            isFile: true,
            isDirectory: false,
            name,
            file: (cb: (file: File) => void) => cb(file),
        } as FileSystemFileEntry;
    };

    const createDirectoryEntry = (name: string, entries: FileSystemEntry[]): FileSystemDirectoryEntry => {
        let hasRead = false;
        return {
            isFile: false,
            isDirectory: true,
            name,
            createReader: () => ({
                readEntries: (cb: (entries: FileSystemEntry[]) => void) => {
                    if (!hasRead) {
                        hasRead = true;
                        cb(entries);
                    } else {
                        cb([]);
                    }
                },
            }),
        } as FileSystemDirectoryEntry;
    };

    const createItem = (file: File | null, entry: FileSystemEntry | null = null): DataTransferItem => {
        return {
            kind: 'file',
            type: file?.type || 'text/plain',
            getAsFile: () => file,
            webkitGetAsEntry: () => entry,
            getAsString: (callback: (data: string) => void) => {
                callback('');
            },
        } as DataTransferItem;
    };

    const createMockDataTransfer = (files: (File | null)[], entries?: (FileSystemEntry | null)[]): DataTransfer => {
        const items: DataTransferItem[] = files.map((file, index) => {
            const entry = entries?.[index] ?? null;
            return createItem(file, entry);
        });

        const itemList = {
            length: items.length,
            [Symbol.iterator]: function* () {
                for (let i = 0; i < items.length; i++) {
                    yield items[i];
                }
            },
            item: (index: number) => items[index] || null,
            add: () => {
                throw new Error('Not implemented');
            },
            remove: () => {
                throw new Error('Not implemented');
            },
            clear: () => {
                throw new Error('Not implemented');
            },
        } as DataTransferItemList;

        for (let i = 0; i < items.length; i++) {
            (itemList as unknown as Record<number, DataTransferItem>)[i] = items[i];
        }

        // Filter out null files for the FileList
        const validFiles = files.filter((f): f is File => f !== null);

        const fileList = {
            length: validFiles.length,
            item: (index: number) => validFiles[index] || null,
            [Symbol.iterator]: function* () {
                for (let i = 0; i < validFiles.length; i++) {
                    yield validFiles[i];
                }
            },
        } as FileList;

        for (let i = 0; i < validFiles.length; i++) {
            (fileList as unknown as Record<number, File>)[i] = validFiles[i];
        }

        return {
            dropEffect: 'none',
            effectAllowed: 'all',
            files: fileList,
            items: itemList,
            types: validFiles.map((f) => f.type),
            clearData: () => {},
            getData: () => '',
            setData: () => {},
            setDragImage: () => {},
        } as DataTransfer;
    };

    it('should process single file with FileSystemEntry support', async () => {
        const file = createFile('test.txt');
        const entry = createFileEntry('test.txt', file);
        const dataTransfer = createMockDataTransfer([file], [entry]);

        const result = await processDroppedItems(dataTransfer);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('test.txt');
    });

    it('should process multiple files with FileSystemEntry support', async () => {
        const file1 = createFile('file1.txt');
        const file2 = createFile('file2.txt');
        const entry1 = createFileEntry('file1.txt', file1);
        const entry2 = createFileEntry('file2.txt', file2);
        const dataTransfer = createMockDataTransfer([file1, file2], [entry1, entry2]);

        const result = await processDroppedItems(dataTransfer);

        expect(result).toHaveLength(2);
        expect(result.map((f) => f.name)).toEqual(['file1.txt', 'file2.txt']);
    });

    it('should fallback to getAsFile when webkitGetAsEntry returns null', async () => {
        const file = createFile('fallback.txt');
        const dataTransfer = createMockDataTransfer([file], [null]);

        const result = await processDroppedItems(dataTransfer);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('fallback.txt');
    });

    it('should handle mixed scenarios with entry and fallback', async () => {
        const file1 = createFile('with-entry.txt');
        const file2 = createFile('without-entry.txt');
        const entry1 = createFileEntry('with-entry.txt', file1);
        const dataTransfer = createMockDataTransfer([file1, file2], [entry1, null]);

        const result = await processDroppedItems(dataTransfer);

        expect(result).toHaveLength(2);
        const names = result.map((f) => f.name).sort();
        expect(names).toEqual(['with-entry.txt', 'without-entry.txt']);
    });

    it('should skip items where getAsFile returns null', async () => {
        const dataTransfer = createMockDataTransfer([null], [null]);

        const result = await processDroppedItems(dataTransfer);

        expect(result).toHaveLength(0);
    });

    it('should handle empty DataTransferItemList', async () => {
        const dataTransfer = createMockDataTransfer([], []);

        const result = await processDroppedItems(dataTransfer);

        expect(result).toHaveLength(0);
    });

    it('should process directory entries', async () => {
        const file1 = createFile('file1.txt');
        const file2 = createFile('file2.txt');
        const fileEntry1 = createFileEntry('file1.txt', file1);
        const fileEntry2 = createFileEntry('file2.txt', file2);
        const dirEntry = createDirectoryEntry('myFolder', [fileEntry1, fileEntry2]);
        const mockFile = new File([''], 'myFolder', { type: '' });
        const dataTransfer = createMockDataTransfer([mockFile], [dirEntry]);

        const result = await processDroppedItems(dataTransfer);

        expect(result).toHaveLength(2);
        expect(result.map((f) => f.name).sort()).toEqual(['file1.txt', 'file2.txt']);
    });

    it('should return fallback files when items list is empty', async () => {
        const fallbackFile = createFile('from-fallback.txt');
        const dataTransfer = createMockDataTransfer([fallbackFile], []);

        const result = await processDroppedItems(dataTransfer);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('from-fallback.txt');
    });

    it('should not deduplicate files without webkitRelativePath', async () => {
        const file1 = createFile('file.txt');
        const file2 = createFile('file.txt');
        const dataTransfer = createMockDataTransfer([file1, file2], [null, null]);

        const result = await processDroppedItems(dataTransfer);

        expect(result).toHaveLength(2);
        expect(result.map((f) => f.name)).toEqual(['file.txt', 'file.txt']);
    });

    it('should pick up files from fallback that are not in items', async () => {
        const file1 = createFile('file1.txt');
        const file2 = createFile('file2.txt');
        const dataTransfer = createMockDataTransfer([file1, file2], [null]);

        const result = await processDroppedItems(dataTransfer);

        expect(result.map((f) => f.name).sort()).toEqual(['file1.txt', 'file2.txt']);
    });

    it('should handle Chrome/Brave quirk where only first file is accessible via getAsFile', async () => {
        const file1 = createFile('first.txt');
        const file2 = createFile('second.txt');
        const dataTransfer = createMockDataTransfer([file1, file2], [null]);

        const result = await processDroppedItems(dataTransfer);

        expect(result.map((f) => f.name).sort()).toEqual(['first.txt', 'second.txt']);
    });

    it('should not duplicate folder contents when folder is processed via FileSystemEntry', async () => {
        const file1 = createFile('file1.txt');
        const file2 = createFile('file2.txt');
        const dirEntry = createDirectoryEntry('myFolder', [
            createFileEntry('file1.txt', file1),
            createFileEntry('file2.txt', file2),
        ]);
        const folderFile = new File([], 'myFolder', { type: '' });
        const dataTransfer = createMockDataTransfer([folderFile], [dirEntry]);

        const result = await processDroppedItems(dataTransfer);

        expect(result.map((f) => f.name).sort()).toEqual(['file1.txt', 'file2.txt']);
    });

    it('should handle mixed files and folders without duplication', async () => {
        const file1 = createFile('standalone.txt');
        const file2 = createFile('nested.txt');
        const dirEntry = createDirectoryEntry('folder', [createFileEntry('nested.txt', file2)]);
        const folderFile = new File([], 'folder', { type: '' });
        const dataTransfer = createMockDataTransfer(
            [file1, folderFile],
            [createFileEntry('standalone.txt', file1), dirEntry]
        );

        const result = await processDroppedItems(dataTransfer);

        expect(result.map((f) => f.name).sort()).toEqual(['nested.txt', 'standalone.txt']);
    });

    it('should process multiple folders in parallel', async () => {
        const file1 = createFile('file1.txt');
        const file2 = createFile('file2.txt');
        const file3 = createFile('file3.txt');
        const dirEntry1 = createDirectoryEntry('folder1', [createFileEntry('file1.txt', file1)]);
        const dirEntry2 = createDirectoryEntry('folder2', [
            createFileEntry('file2.txt', file2),
            createFileEntry('file3.txt', file3),
        ]);
        const folder1File = new File([], 'folder1', { type: '' });
        const folder2File = new File([], 'folder2', { type: '' });
        const dataTransfer = createMockDataTransfer([folder1File, folder2File], [dirEntry1, dirEntry2]);

        const result = await processDroppedItems(dataTransfer);

        expect(result.map((f) => f.name).sort()).toEqual(['file1.txt', 'file2.txt', 'file3.txt']);
    });

    it('should filter out multiple root folders from fallback', async () => {
        const file1 = createFile('file1.txt');
        const file2 = createFile('file2.txt');
        const dirEntry1 = createDirectoryEntry('folder1', [createFileEntry('file1.txt', file1)]);
        const dirEntry2 = createDirectoryEntry('folder2', [createFileEntry('file2.txt', file2)]);
        const folder1File = new File([], 'folder1', { type: '' });
        const folder2File = new File([], 'folder2', { type: '' });
        const dataTransfer = createMockDataTransfer([folder1File, folder2File], [dirEntry1, dirEntry2]);

        const result = await processDroppedItems(dataTransfer);

        expect(result.map((f) => f.name).sort()).toEqual(['file1.txt', 'file2.txt']);
    });

    it('should NOT deduplicate files with same name from different folders', async () => {
        const file1 = createFile('duplicate.txt');
        const file2 = createFile('duplicate.txt');
        const dirEntry1 = createDirectoryEntry('folder1', [createFileEntry('duplicate.txt', file1)]);
        const dirEntry2 = createDirectoryEntry('folder2', [createFileEntry('duplicate.txt', file2)]);
        const folder1File = new File([], 'folder1', { type: '' });
        const folder2File = new File([], 'folder2', { type: '' });
        const dataTransfer = createMockDataTransfer([folder1File, folder2File], [dirEntry1, dirEntry2]);

        const result = await processDroppedItems(dataTransfer);

        expect(result).toHaveLength(2);
        expect(result.map((f) => f.name)).toEqual(['duplicate.txt', 'duplicate.txt']);
        expect((result[0] as any).webkitRelativePath).toBe('folder1/duplicate.txt');
        expect((result[1] as any).webkitRelativePath).toBe('folder2/duplicate.txt');
    });

    it('should not filter out legitimate files that have same name as a folder', async () => {
        const file = createFile('test');
        const fileInFolder = createFile('nested.txt');
        const dirEntry = createDirectoryEntry('test', [createFileEntry('nested.txt', fileInFolder)]);
        const testFile = createFile('test');
        const folderFile = new File([], 'test', { type: '' });
        const dataTransfer = createMockDataTransfer([testFile, folderFile], [createFileEntry('test', file), dirEntry]);

        const result = await processDroppedItems(dataTransfer);

        expect(result.map((f) => f.name).sort()).toEqual(['nested.txt', 'test']);
    });
});
