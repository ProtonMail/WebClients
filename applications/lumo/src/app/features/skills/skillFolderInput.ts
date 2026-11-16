import { README_PATH, isPluginManifestPath } from './skillBundle';
import { MAX_SKILL_FILE_COUNT } from './skillFiles';
import { type SkillFolderFile, isIgnoredBundlePath } from './skillImport';
import { SKILL_MARKDOWN_PATH } from './types';

/** Stops walking a dropped folder well past the file limit, so dropping a huge tree stays cheap. */
const MAX_WALKED_FILES = MAX_SKILL_FILE_COUNT * 2;

export type DroppedSkillItem =
    | { kind: 'file'; file: File }
    | { kind: 'folder'; name: string; files: SkillFolderFile[] };

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

const groupByTopFolder = (files: SkillFolderFile[]): Map<string, SkillFolderFile[]> => {
    const byFolder = new Map<string, SkillFolderFile[]>();
    for (const file of files) {
        const folder = file.path.split('/')[0];
        byFolder.set(folder, [...(byFolder.get(folder) ?? []), file]);
    }
    return byFolder;
};

const BUNDLE_ROOT_FILES = [SKILL_MARKDOWN_PATH, README_PATH];

/**
 * Picking a folder that only holds skill folders, like `~/.claude/skills`, adds each skill on its own:
 * pickers take one folder, and a skill set named "skills" is not what the user meant. A folder with its
 * own SKILL.md, README or plugin manifest is still added as one.
 */
const splitSkillsFolder = (name: string, files: SkillFolderFile[]): DroppedSkillItem[] => {
    const inside = files.map(({ path, file }) => ({ path: path.slice(name.length + 1), file }));
    const isBundle = inside.some(({ path }) => BUNDLE_ROOT_FILES.includes(path) || isPluginManifestPath(path));
    const skills = Array.from(groupByTopFolder(inside.filter(({ path }) => path.includes('/')))).filter(
        ([skillName, skillFiles]) => skillFiles.some(({ path }) => path === `${skillName}/${SKILL_MARKDOWN_PATH}`)
    );
    if (isBundle || !skills.length) {
        return [{ kind: 'folder', name, files }];
    }
    return skills.map(([skillName, skillFiles]) => ({ kind: 'folder', name: skillName, files: skillFiles }));
};

/** Groups files from an `<input webkitdirectory>` by their top folder. */
export const groupPickedFolderFiles = (files: File[]): DroppedSkillItem[] => {
    const picked = files.map((file) => ({ path: file.webkitRelativePath || file.name, file }));
    return Array.from(groupByTopFolder(picked)).flatMap(([name, folderFiles]) => splitSkillsFolder(name, folderFiles));
};
