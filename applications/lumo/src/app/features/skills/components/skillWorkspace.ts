import JSZip from 'jszip';

import { hasRootSkillMarkdown } from '../skillBundle';
import {
    decodeText,
    encodeText,
    getSkillFileMimeType,
    isBlockedSkillFile,
    isTextSkillFile,
    normalizeSkillFilePath,
} from '../skillFiles';
import { buildSkillMarkdown, parseSkillMarkdown, setSkillMarkdownName } from '../skillMarkdown';
import { SKILL_MARKDOWN_PATH, type Skill, type SkillFileDraft } from '../types';

/** A file as shown in the skill editor and viewer. Text files are edited as strings. */
export type WorkspaceFile = {
    path: string;
    mimeType: string;
    text?: string;
    data?: Uint8Array<ArrayBuffer>;
    id?: string;
    createdAt?: string;
};

export const isSkillMarkdown = (file: Pick<WorkspaceFile, 'path'>) => file.path === SKILL_MARKDOWN_PATH;

export const toWorkspaceFile = (file: SkillFileDraft): WorkspaceFile =>
    isTextSkillFile(file.mimeType)
        ? {
              id: file.id,
              createdAt: file.createdAt,
              path: file.path,
              mimeType: file.mimeType,
              text: decodeText(file.data),
          }
        : { ...file };

export const toSkillFileDraft = ({ id, createdAt, path, mimeType, text, data }: WorkspaceFile): SkillFileDraft => ({
    id,
    createdAt,
    path,
    mimeType,
    data: text !== undefined ? encodeText(text) : (data ?? new Uint8Array()),
});

export const sortWorkspaceFiles = (files: WorkspaceFile[]) =>
    [...files].sort((a, b) => {
        if (isSkillMarkdown(a)) return -1;
        if (isSkillMarkdown(b)) return 1;
        return a.path.localeCompare(b.path);
    });

export const getWorkspaceFileSize = (file: WorkspaceFile) =>
    file.text !== undefined ? encodeText(file.text).byteLength : (file.data?.byteLength ?? 0);

const isInFolder = (folder: string, path: string) => path.startsWith(`${folder}/`);

export const getParentFolder = (path: string) => path.slice(0, Math.max(0, path.lastIndexOf('/')));

const getBaseName = (path: string) => path.slice(path.lastIndexOf('/') + 1);

const joinPath = (folder: string, name: string) => (folder ? `${folder}/${name}` : name);

/** The files being edited, and the folders the user made that hold no file yet. Empty folders are not saved. */
export type Workspace = { files: WorkspaceFile[]; folders: string[] };

export type WorkspaceEntryKind = 'file' | 'folder';

export type WorkspacePathError = 'invalid' | 'taken' | 'blocked';

export type WorkspaceChange = { workspace: Workspace; path: string } | { error: WorkspacePathError };

const listPaths = ({ files, folders }: Workspace) => [...files.map((file) => file.path), ...folders];

/** Whether a file or folder already uses this path, or a file sits where one of its folders would go. */
const isWorkspacePathTaken = (workspace: Workspace, path: string) =>
    listPaths(workspace).some((other) => other === path || isInFolder(path, other)) ||
    workspace.files.some((file) => isInFolder(file.path, path));

/** Drops the empty folders that now hold a file or another folder. */
const pruneFolders = (workspace: Workspace): Workspace => {
    const paths = listPaths(workspace);
    const folders = [...new Set(workspace.folders)].filter((folder) => !paths.some((path) => isInFolder(folder, path)));
    return { files: workspace.files, folders };
};

/**
 * `base`, or `base-2`, `base-3`… inside `parent`: the first folder path nothing uses yet. Undefined when a
 * file sits where `parent` or one of its folders would go, since no folder can be made there.
 */
export const getAvailableFolderPath = (workspace: Workspace, parent: string, base: string) => {
    if (parent && workspace.files.some((file) => file.path === parent || isInFolder(file.path, parent))) {
        return undefined;
    }
    for (let index = 1; ; index++) {
        const path = joinPath(parent, index === 1 ? base : `${base}-${index}`);
        if (!isWorkspacePathTaken(workspace, path)) {
            return path;
        }
    }
};

/** Adds an empty file or folder called `rawName` in `folder`. A name with `/` creates the folders on the way. */
export const createWorkspaceEntry = (
    workspace: Workspace,
    folder: string,
    rawName: string,
    kind: WorkspaceEntryKind
): WorkspaceChange => {
    const name = rawName.trim();
    const path = normalizeSkillFilePath(joinPath(folder, name));
    if (!name || !path || (kind === 'file' && name.endsWith('/'))) {
        return { error: 'invalid' };
    }
    if (isWorkspacePathTaken(workspace, path)) {
        return { error: 'taken' };
    }
    if (kind === 'folder') {
        return { path, workspace: pruneFolders({ ...workspace, folders: [...workspace.folders, path] }) };
    }
    if (isBlockedSkillFile(path)) {
        return { error: 'blocked' };
    }
    const file: WorkspaceFile = { path, mimeType: getSkillFileMimeType(path), text: '' };
    return { path, workspace: pruneFolders({ ...workspace, files: [...workspace.files, file] }) };
};

/** A text file stays text and a binary one stays binary, whatever the new extension says. */
const getRenamedMimeType = (file: WorkspaceFile, path: string) => {
    const mimeType = getSkillFileMimeType(path);
    return isTextSkillFile(mimeType) === (file.text !== undefined) ? mimeType : file.mimeType;
};

/**
 * Renames a file, or a folder with everything in it, keeping it in the same parent. A skill's SKILL.md
 * whose frontmatter name is still its folder name follows a folder rename, as it does in a new skill.
 */
export const renameWorkspaceEntry = (
    workspace: Workspace,
    path: string,
    rawName: string,
    kind: WorkspaceEntryKind
): WorkspaceChange => {
    const name = rawName.trim();
    const oldName = getBaseName(path);
    if (name === oldName) {
        return { workspace, path };
    }
    const target = joinPath(getParentFolder(path), name);
    if (!name || /[/\\]/.test(name) || normalizeSkillFilePath(target) !== target) {
        return { error: 'invalid' };
    }
    if (isWorkspacePathTaken(workspace, target)) {
        return { error: 'taken' };
    }
    if (kind === 'file') {
        if (isBlockedSkillFile(target)) {
            return { error: 'blocked' };
        }
        const files = workspace.files.map((file) =>
            file.path === path ? { ...file, path: target, mimeType: getRenamedMimeType(file, target) } : file
        );
        return { path: target, workspace: { ...workspace, files } };
    }
    const move = (other: string) =>
        other === path || isInFolder(path, other) ? `${target}${other.slice(path.length)}` : other;
    const skillMarkdownPath = `${path}/${SKILL_MARKDOWN_PATH}`;
    const files = workspace.files.map((file) => {
        if (!isInFolder(path, file.path)) {
            return file;
        }
        const text =
            file.path === skillMarkdownPath &&
            file.text !== undefined &&
            parseSkillMarkdown(file.text).frontmatter.name === oldName
                ? setSkillMarkdownName(file.text, name)
                : file.text;
        return { ...file, path: move(file.path), text };
    });
    return { path: target, workspace: { files, folders: workspace.folders.map(move) } };
};

/** Removes a file, or a folder with everything in it. */
export const removeWorkspaceEntry = (workspace: Workspace, path: string, kind: WorkspaceEntryKind): Workspace => {
    const removed = (other: string) => other === path || (kind === 'folder' && isInFolder(path, other));
    return {
        files: workspace.files.filter((file) => !removed(file.path)),
        folders: workspace.folders.filter((folder) => !removed(folder)),
    };
};

/** Rebuilds the bundle in the same layout it is uploaded in, so a download can be re-uploaded. */
export const buildSkillArchive = async (skill: Skill, files: SkillFileDraft[]): Promise<Blob> => {
    const zip = new JSZip();
    if (hasRootSkillMarkdown(skill)) {
        zip.file(SKILL_MARKDOWN_PATH, buildSkillMarkdown(skill));
    }
    for (const file of files) {
        zip.file(file.path, file.data);
    }
    return zip.generateAsync({ type: 'blob' });
};
