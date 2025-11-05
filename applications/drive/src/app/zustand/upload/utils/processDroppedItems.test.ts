import { processDroppedItems } from './processDroppedItems';

describe('processDroppedItems', () => {
    const createMockFile = (name: string): File => {
        return new File(['content'], name, { type: 'text/plain' });
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

    const createMockDataTransferItem = (file: File, entry: FileSystemEntry | null): DataTransferItem => {
        return {
            kind: 'file',
            type: file.type,
            getAsFile: () => {
                return file;
            },
            webkitGetAsEntry: () => {
                return entry;
            },
        } as DataTransferItem;
    };

    const createMockDataTransferItemList = (items: DataTransferItem[]): DataTransferItemList => {
        const list = {
            length: items.length,
            [Symbol.iterator]: function* () {
                for (let i = 0; i < items.length; i++) {
                    yield items[i];
                }
            },
            item: (index: number) => {
                return items[index] || null;
            },
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
            (list as unknown as Record<number, DataTransferItem>)[i] = items[i];
        }

        return list;
    };

    const createMockFileList = (files: File[]): FileList => {
        const list = {
            length: files.length,
            item: (index: number) => {
                return files[index] || null;
            },
            [Symbol.iterator]: function* () {
                for (let i = 0; i < files.length; i++) {
                    yield files[i];
                }
            },
        } as FileList;

        for (let i = 0; i < files.length; i++) {
            (list as unknown as Record<number, File>)[i] = files[i];
        }

        return list;
    };

    it('should process single file with FileSystemEntry support', async () => {
        const mockFile = createMockFile('test.txt');
        const fileEntry = createMockFileEntry('test.txt', mockFile);
        const dataTransferItem = createMockDataTransferItem(mockFile, fileEntry);
        const itemList = createMockDataTransferItemList([dataTransferItem]);

        const result = await processDroppedItems(itemList, createMockFileList([]));

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('test.txt');
    });

    it('should process multiple files with FileSystemEntry support', async () => {
        const mockFile1 = createMockFile('file1.txt');
        const mockFile2 = createMockFile('file2.txt');
        const fileEntry1 = createMockFileEntry('file1.txt', mockFile1);
        const fileEntry2 = createMockFileEntry('file2.txt', mockFile2);
        const item1 = createMockDataTransferItem(mockFile1, fileEntry1);
        const item2 = createMockDataTransferItem(mockFile2, fileEntry2);
        const itemList = createMockDataTransferItemList([item1, item2]);

        const result = await processDroppedItems(itemList, createMockFileList([]));

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('file1.txt');
        expect(result[1].name).toBe('file2.txt');
    });

    it('should fallback to getAsFile when webkitGetAsEntry returns null', async () => {
        const mockFile = createMockFile('fallback.txt');
        const dataTransferItem = createMockDataTransferItem(mockFile, null);
        const itemList = createMockDataTransferItemList([dataTransferItem]);

        const result = await processDroppedItems(itemList, createMockFileList([]));

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('fallback.txt');
    });

    it('should handle mixed scenarios with entry and fallback', async () => {
        const mockFile1 = createMockFile('with-entry.txt');
        const mockFile2 = createMockFile('without-entry.txt');
        const fileEntry1 = createMockFileEntry('with-entry.txt', mockFile1);
        const item1 = createMockDataTransferItem(mockFile1, fileEntry1);
        const item2 = createMockDataTransferItem(mockFile2, null);
        const itemList = createMockDataTransferItemList([item1, item2]);

        const result = await processDroppedItems(itemList, createMockFileList([]));

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('with-entry.txt');
        expect(result[1].name).toBe('without-entry.txt');
    });

    it('should skip items where getAsFile returns null', async () => {
        const dataTransferItem = {
            kind: 'file',
            type: 'text/plain',
            getAsFile: () => {
                return null;
            },
            webkitGetAsEntry: () => {
                return null;
            },
        } as DataTransferItem;
        const itemList = createMockDataTransferItemList([dataTransferItem]);

        const result = await processDroppedItems(itemList, createMockFileList([]));

        expect(result).toHaveLength(0);
    });

    it('should skip non-file items', async () => {
        const dataTransferItem = {
            kind: 'string',
            type: 'text/plain',
            getAsFile: () => {
                return null;
            },
            webkitGetAsEntry: () => {
                return null;
            },
        } as DataTransferItem;
        const itemList = createMockDataTransferItemList([dataTransferItem]);

        const result = await processDroppedItems(itemList, createMockFileList([]));

        expect(result).toHaveLength(0);
    });

    it('should handle empty DataTransferItemList', async () => {
        const itemList = createMockDataTransferItemList([]);

        const result = await processDroppedItems(itemList, createMockFileList([]));

        expect(result).toHaveLength(0);
    });

    it('should process directory entries', async () => {
        const mockFile1 = createMockFile('file1.txt');
        const mockFile2 = createMockFile('file2.txt');
        const fileEntry1 = createMockFileEntry('file1.txt', mockFile1);
        const fileEntry2 = createMockFileEntry('file2.txt', mockFile2);

        const dirEntry = {
            isFile: false,
            isDirectory: true,
            name: 'myFolder',
            createReader: () => {
                let entriesRemaining = [fileEntry1, fileEntry2];
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

        const mockFile = createMockFile('folder');
        const dataTransferItem = createMockDataTransferItem(mockFile, dirEntry);
        const itemList = createMockDataTransferItemList([dataTransferItem]);

        const result = await processDroppedItems(itemList, createMockFileList([]));

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('file1.txt');
        expect(result[1].name).toBe('file2.txt');
    });

    it('should return fallback files when items list is empty', async () => {
        const mockFile = new File(['content'], 'from-fallback.txt', { type: 'text/plain' });
        const fallbackList = createMockFileList([mockFile]);
        const itemList = createMockDataTransferItemList([]);

        const result = await processDroppedItems(itemList, fallbackList);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('from-fallback.txt');
    });

    it('should keep item files preferred over duplicates found in fallback', async () => {
        const mockFile = createMockFile('from-items.txt');
        const itemList = createMockDataTransferItemList([createMockDataTransferItem(mockFile, null)]);

        const duplicate = new File(['content'], 'from-items.txt', { type: 'text/plain' });
        const extra = new File(['content'], 'extra.txt', { type: 'text/plain' });
        const fallbackList = createMockFileList([duplicate, extra]);

        const result = await processDroppedItems(itemList, fallbackList);

        expect(result).toHaveLength(2);
        expect(result.find((file) => file.name === 'from-items.txt')).toBeDefined();
        expect(result.find((file) => file.name === 'extra.txt')).toBeDefined();
    });
});
