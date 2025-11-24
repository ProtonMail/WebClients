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

    const createItem = (file: File | null, entry: FileSystemEntry | null = null): DataTransferItem => {
        return {
            kind: 'file',
            type: file?.type || 'text/plain',
            getAsFile: () => file,
            webkitGetAsEntry: () => entry,
        } as DataTransferItem;
    };

    const createItemList = (items: DataTransferItem[]): DataTransferItemList => {
        return Object.assign(items, {
            length: items.length,
            item: (index: number) => items[index] || null,
        }) as unknown as DataTransferItemList;
    };

    const createFileList = (files: File[]): FileList => {
        return Object.assign(files, {
            length: files.length,
            item: (index: number) => files[index] || null,
        }) as unknown as FileList;
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

    it('should process single file with FileSystemEntry', async () => {
        const file = createFile('test.txt');
        const entry = createFileEntry('test.txt', file);
        const items = createItemList([createItem(file, entry)]);

        const result = await processDroppedItems(items, createFileList([]));

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('test.txt');
    });

    it('should process multiple files with FileSystemEntry', async () => {
        const file1 = createFile('file1.txt');
        const file2 = createFile('file2.txt');
        const items = createItemList([
            createItem(file1, createFileEntry('file1.txt', file1)),
            createItem(file2, createFileEntry('file2.txt', file2)),
        ]);

        const result = await processDroppedItems(items, createFileList([]));

        expect(result.map((f) => f.name)).toEqual(['file1.txt', 'file2.txt']);
    });

    it('should fallback to getAsFile when webkitGetAsEntry returns null', async () => {
        const file = createFile('fallback.txt');
        const items = createItemList([createItem(file, null)]);

        const result = await processDroppedItems(items, createFileList([]));

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('fallback.txt');
    });

    it('should skip items where getAsFile returns null', async () => {
        const items = createItemList([createItem(null, null)]);

        const result = await processDroppedItems(items, createFileList([]));

        expect(result).toHaveLength(0);
    });

    it('should handle empty DataTransferItemList', async () => {
        const result = await processDroppedItems(createItemList([]), createFileList([]));

        expect(result).toHaveLength(0);
    });

    it('should process directory entries', async () => {
        const file1 = createFile('file1.txt');
        const file2 = createFile('file2.txt');
        const dirEntry = createDirectoryEntry('myFolder', [
            createFileEntry('file1.txt', file1),
            createFileEntry('file2.txt', file2),
        ]);
        const items = createItemList([createItem(createFile('folder'), dirEntry)]);

        const result = await processDroppedItems(items, createFileList([]));

        expect(result.map((f) => f.name)).toEqual(['file1.txt', 'file2.txt']);
    });

    it('should return fallback files when items list is empty', async () => {
        const fallback = createFileList([createFile('from-fallback.txt')]);

        const result = await processDroppedItems(createItemList([]), fallback);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('from-fallback.txt');
    });

    it('should dedupe files by name between items and fallback', async () => {
        const file = createFile('from-items.txt');
        const items = createItemList([createItem(file, null)]);
        const fallback = createFileList([createFile('from-items.txt'), createFile('extra.txt')]);

        const result = await processDroppedItems(items, fallback);

        expect(result.map((f) => f.name).sort()).toEqual(['extra.txt', 'from-items.txt']);
    });

    it('should pick up files from fallback that are not in items', async () => {
        const items = createItemList([createItem(createFile('file1.txt'), null)]);
        const fallback = createFileList([createFile('file1.txt'), createFile('file2.txt')]);

        const result = await processDroppedItems(items, fallback);

        expect(result.map((f) => f.name).sort()).toEqual(['file1.txt', 'file2.txt']);
    });

    it('should handle Chrome/Brave quirk where only first file is accessible via getAsFile', async () => {
        const items = createItemList([createItem(createFile('first.txt'), null), createItem(null, null)]);
        const fallback = createFileList([createFile('first.txt'), createFile('second.txt')]);

        const result = await processDroppedItems(items, fallback);

        expect(result.map((f) => f.name)).toEqual(['first.txt', 'second.txt']);
    });

    it('should not duplicate folder contents when folder is processed via FileSystemEntry', async () => {
        const file1 = createFile('file1.txt');
        const file2 = createFile('file2.txt');
        const dirEntry = createDirectoryEntry('myFolder', [
            createFileEntry('file1.txt', file1),
            createFileEntry('file2.txt', file2),
        ]);
        const items = createItemList([createItem(createFile('myFolder'), dirEntry)]);
        const fallback = createFileList([new File([], 'myFolder', { type: '' })]);

        const result = await processDroppedItems(items, fallback);

        expect(result.map((f) => f.name)).toEqual(['file1.txt', 'file2.txt']);
    });

    it('should handle mixed files and folders without duplication', async () => {
        const file1 = createFile('standalone.txt');
        const file2 = createFile('nested.txt');
        const dirEntry = createDirectoryEntry('folder', [createFileEntry('nested.txt', file2)]);
        const items = createItemList([
            createItem(file1, createFileEntry('standalone.txt', file1)),
            createItem(createFile('folder'), dirEntry),
        ]);
        const fallback = createFileList([createFile('standalone.txt'), new File([], 'folder', { type: '' })]);

        const result = await processDroppedItems(items, fallback);

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
        const items = createItemList([
            createItem(createFile('folder1'), dirEntry1),
            createItem(createFile('folder2'), dirEntry2),
        ]);

        const result = await processDroppedItems(items, createFileList([]));

        expect(result.map((f) => f.name).sort()).toEqual(['file1.txt', 'file2.txt', 'file3.txt']);
    });

    it('should filter out multiple root folders from fallback', async () => {
        const file1 = createFile('file1.txt');
        const file2 = createFile('file2.txt');
        const dirEntry1 = createDirectoryEntry('folder1', [createFileEntry('file1.txt', file1)]);
        const dirEntry2 = createDirectoryEntry('folder2', [createFileEntry('file2.txt', file2)]);
        const items = createItemList([
            createItem(createFile('folder1'), dirEntry1),
            createItem(createFile('folder2'), dirEntry2),
        ]);
        const fallback = createFileList([new File([], 'folder1', { type: '' }), new File([], 'folder2', { type: '' })]);

        const result = await processDroppedItems(items, fallback);

        expect(result.map((f) => f.name).sort()).toEqual(['file1.txt', 'file2.txt']);
    });

    it('should deduplicate files with same name from different entries', async () => {
        const file1 = createFile('duplicate.txt');
        const file2 = createFile('duplicate.txt');
        const dirEntry1 = createDirectoryEntry('folder1', [createFileEntry('duplicate.txt', file1)]);
        const dirEntry2 = createDirectoryEntry('folder2', [createFileEntry('duplicate.txt', file2)]);
        const items = createItemList([
            createItem(createFile('folder1'), dirEntry1),
            createItem(createFile('folder2'), dirEntry2),
        ]);

        const result = await processDroppedItems(items, createFileList([]));

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('duplicate.txt');
    });

    it('should not filter out legitimate files that have same name as a folder', async () => {
        const file = createFile('test');
        const fileInFolder = createFile('nested.txt');
        const dirEntry = createDirectoryEntry('test', [createFileEntry('nested.txt', fileInFolder)]);
        const items = createItemList([
            createItem(file, createFileEntry('test', file)),
            createItem(createFile('test'), dirEntry),
        ]);
        const fallback = createFileList([createFile('test'), new File([], 'test', { type: '' })]);

        const result = await processDroppedItems(items, fallback);

        expect(result.map((f) => f.name).sort()).toEqual(['nested.txt', 'test']);
    });
});
