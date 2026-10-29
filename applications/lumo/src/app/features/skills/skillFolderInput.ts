import { MAX_SKILL_FILE_COUNT } from './skillFiles';
import { type SkillFolderFile, isIgnoredBundlePath } from './skillImport';

/** Stops walking a dropped folder well past the file limit, so dropping a huge tree stays cheap. */
const MAX_WALKED_FILES = MAX_SKILL_FILE_COUNT * 2;

export type DroppedSkillItem =
    { kind: 'file'; file: File } | { kind: 'folder'; name: string; files: SkillFolderFile[] };

const readAllEntries = async (directory: FileSystemDirectoryEntry): Promise<FileSystemEntry[]> => {
    const reader = directory.createReader();
    const all: FileSystemEntry[] = [];
    // readEntries returns batches until it returns an empty one.
    for (;;) {
        const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => reader.readEntries(resolve, reject));
        if (!batch.length) return all;
        all.push(...batch);
    }
};

const walk = async (entry: FileSystemEntry, path: string, out: SkillFolderFile[]): Promise<void> => {
    if (out.length > MAX_WALKED_FILES || isIgnoredBundlePath(path)) {
        return;
    }
    if (entry.isFile) {
        const file = await new Promise<File>((resolve, reject) => (entry as FileSystemFileEntry).file(resolve, reject));
        out.push({ path, file });
        return;
    }
    if (entry.isDirectory) {
        for (const child of await readAllEntries(entry as FileSystemDirectoryEntry)) {
            await walk(child, `${path}/${child.name}`, out);
        }
    }
};

/** Splits a drop into plain files and folders, walking folders into relative paths. */
export const readDroppedItems = async (dataTransfer: DataTransfer): Promise<DroppedSkillItem[]> => {
    const entries = Array.from(dataTransfer.items)
        .filter((item) => item.kind === 'file')
        .map((item) => ({ entry: item.webkitGetAsEntry?.() ?? null, file: item.getAsFile() }));

    const items: DroppedSkillItem[] = [];
    for (const { entry, file } of entries) {
        if (entry?.isDirectory) {
            const files: SkillFolderFile[] = [];
            await walk(entry, entry.name, files);
            items.push({ kind: 'folder', name: entry.name, files });
        } else if (file) {
            items.push({ kind: 'file', file });
        }
    }
    return items;
};

/** Groups files from an `<input webkitdirectory>` by their top folder. */
export const groupPickedFolderFiles = (files: File[]): DroppedSkillItem[] => {
    const byFolder = new Map<string, SkillFolderFile[]>();
    for (const file of files) {
        const path = file.webkitRelativePath || file.name;
        const folder = path.split('/')[0];
        const group = byFolder.get(folder) ?? [];
        group.push({ path, file });
        byFolder.set(folder, group);
    }
    return Array.from(byFolder, ([name, folderFiles]) => ({ kind: 'folder' as const, name, files: folderFiles }));
};
