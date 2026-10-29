import JSZip from 'jszip';
import { c } from 'ttag';

import {
    PLUGIN_MANIFEST_PATH,
    README_PATH,
    findSubSkills,
    isSubSkillMarkdownPath,
    parsePluginManifest,
} from './skillBundle';
import {
    MAX_SKILL_FILE_BYTES,
    MAX_SKILL_FILE_COUNT,
    MAX_SKILL_TOTAL_BYTES,
    decodeText,
    getSkillFileMimeType,
    isBlockedSkillFile,
    normalizeSkillFilePath,
} from './skillFiles';
import { SKILL_DESCRIPTION_MAX_LENGTH, SKILL_NAME_MAX_LENGTH, parseSkillMarkdown } from './skillMarkdown';
import { SKILL_MARKDOWN_PATH, type SkillDraft, type SkillFileDraft } from './types';

export type SkillImportResult = { fileName: string } & (
    { draft: SkillDraft; error?: never } | { error: string; draft?: never }
);

/** A file picked from a folder, with its path relative to the picked folder's parent. */
export type SkillFolderFile = { path: string; file: File };

type BundleEntry = { path: string; read: () => Promise<Uint8Array<ArrayBuffer>> };

class SkillImportError extends Error {}

const tooLarge = () => new SkillImportError(c('collider_2025:Error').t`This skill is too large.`);

/** OS and VCS clutter that is never part of a skill. */
export const isIgnoredBundlePath = (path: string) =>
    /(^|\/)(__MACOSX|\.git|node_modules)(\/|$)/.test(path) || /(^|\/)(\.DS_Store|Thumbs\.db)$/.test(path);

const validateNameAndDescription = (name: string, description: string, file = SKILL_MARKDOWN_PATH) => {
    if (!name.trim() || !description.trim()) {
        throw new SkillImportError(
            c('collider_2025:Error').t`${file} must have a name and description in its YAML frontmatter.`
        );
    }
    if (name.length > SKILL_NAME_MAX_LENGTH) {
        throw new SkillImportError(
            c('collider_2025:Error').t`The skill name must be ${SKILL_NAME_MAX_LENGTH} characters or fewer.`
        );
    }
    if (description.length > SKILL_DESCRIPTION_MAX_LENGTH) {
        throw new SkillImportError(
            c('collider_2025:Error')
                .t`The skill description must be ${SKILL_DESCRIPTION_MAX_LENGTH} characters or fewer.`
        );
    }
};

const draftFromMarkdown = (markdown: string, files: SkillFileDraft[]): SkillDraft => {
    const { frontmatter, body } = parseSkillMarkdown(markdown);
    const { name = '', description = '', ...metadata } = frontmatter;
    validateNameAndDescription(name, description);
    return {
        name: name.trim(),
        description: description.trim(),
        instructions: body,
        source: 'uploaded',
        metadata: Object.keys(metadata).length ? metadata : undefined,
        files,
    };
};

/** First prose paragraph of a README, used when a bundle has no description of its own. */
const readmeSummary = (files: SkillFileDraft[]) => {
    const readme = files.find((file) => file.path === README_PATH);
    if (!readme) return undefined;
    return decodeText(readme.data)
        .split(/\r?\n\s*\r?\n/)
        .map((block) => block.trim())
        .find((block) => block && !/^(#|>|```|\||!\[|<)/.test(block))
        ?.replace(/\s+/g, ' ')
        .slice(0, SKILL_DESCRIPTION_MAX_LENGTH);
};

/** A Claude plugin or a folder of skills: the sub-skills live in nested SKILL.md files. */
const draftFromBundle = (rootName: string, markdown: string | undefined, files: SkillFileDraft[]): SkillDraft => {
    const subSkills = findSubSkills(files);
    for (const file of files.filter(({ path }) => isSubSkillMarkdownPath(path))) {
        const { frontmatter } = parseSkillMarkdown(decodeText(file.data));
        validateNameAndDescription(frontmatter.name ?? '', frontmatter.description ?? '', file.path);
    }
    const manifestFile = files.find((file) => file.path === PLUGIN_MANIFEST_PATH);
    const manifest = manifestFile ? parsePluginManifest(decodeText(manifestFile.data)) : undefined;
    if (manifestFile && !manifest) {
        throw new SkillImportError(c('collider_2025:Error').t`The plugin.json file could not be read.`);
    }
    const root = markdown ? parseSkillMarkdown(markdown) : undefined;
    const name = manifest?.name ?? root?.frontmatter.name ?? rootName;
    const description =
        manifest?.description ??
        root?.frontmatter.description ??
        readmeSummary(files) ??
        subSkills.map((subSkill) => subSkill.name).join(', ');
    validateNameAndDescription(
        name.slice(0, SKILL_NAME_MAX_LENGTH),
        description.slice(0, SKILL_DESCRIPTION_MAX_LENGTH)
    );
    return {
        name: name.slice(0, SKILL_NAME_MAX_LENGTH).trim(),
        description: description.slice(0, SKILL_DESCRIPTION_MAX_LENGTH).trim(),
        instructions: root?.body ?? '',
        source: 'uploaded',
        files,
    };
};

/** Bundles are usually zipped or picked with one top-level folder; strip it so paths start at the bundle root. */
const stripSharedFolder = (paths: string[]): { prefix: string; rootName?: string } => {
    const first = paths[0]?.split('/')[0];
    if (first && paths.every((path) => path.startsWith(`${first}/`))) {
        return { prefix: `${first}/`, rootName: first };
    }
    return { prefix: '' };
};

const importEntries = async (rawEntries: BundleEntry[], fallbackName: string): Promise<SkillDraft> => {
    const entries: BundleEntry[] = [];
    for (const entry of rawEntries) {
        if (isIgnoredBundlePath(entry.path)) continue;
        const path = normalizeSkillFilePath(entry.path);
        if (!path) {
            throw new SkillImportError(c('collider_2025:Error').t`The upload contains an unsafe file path.`);
        }
        entries.push({ ...entry, path });
    }

    const { prefix, rootName } = stripSharedFolder(entries.map(({ path }) => path));
    const bundle = entries.map((entry) => ({ ...entry, path: entry.path.slice(prefix.length) }));
    const paths = bundle.map(({ path }) => path);
    const isPlugin = paths.includes(PLUGIN_MANIFEST_PATH);
    const hasRootMarkdown = paths.includes(SKILL_MARKDOWN_PATH);
    if (!isPlugin && !hasRootMarkdown && !paths.some(isSubSkillMarkdownPath)) {
        throw new SkillImportError(c('collider_2025:Error').t`The upload must include a SKILL.md file.`);
    }
    if (bundle.length > MAX_SKILL_FILE_COUNT + 1) {
        throw new SkillImportError(
            c('collider_2025:Error').t`A skill can contain at most ${MAX_SKILL_FILE_COUNT} files.`
        );
    }

    let totalBytes = 0;
    let markdown: string | undefined;
    const files: SkillFileDraft[] = [];
    // Read sequentially so an oversized bundle is rejected before the remaining entries are inflated.
    for (const { path, read } of bundle) {
        if (isBlockedSkillFile(path)) {
            throw new SkillImportError(c('collider_2025:Error').t`Executable files are not allowed in skills: ${path}`);
        }
        const data = await read();
        totalBytes += data.byteLength;
        if (data.byteLength > MAX_SKILL_FILE_BYTES || totalBytes > MAX_SKILL_TOTAL_BYTES) {
            throw tooLarge();
        }
        if (path === SKILL_MARKDOWN_PATH) {
            markdown = decodeText(data);
        } else {
            files.push({ path, mimeType: getSkillFileMimeType(path), data });
        }
    }

    const nested = files.some(({ path }) => isSubSkillMarkdownPath(path));
    if (markdown !== undefined && !isPlugin && !nested) {
        return draftFromMarkdown(markdown, files);
    }
    return draftFromBundle(rootName ?? fallbackName, markdown, files);
};

const withoutExtension = (fileName: string) => fileName.replace(/\.[^.]+$/, '');

const importArchive = async (file: File): Promise<SkillDraft> => {
    let zip: JSZip;
    try {
        zip = await JSZip.loadAsync(file);
    } catch {
        throw new SkillImportError(c('collider_2025:Error').t`This archive could not be opened.`);
    }
    const entries = Object.values(zip.files)
        .filter((entry) => !entry.dir)
        .map((entry): BundleEntry => ({
            path: entry.name,
            read: async () => (await entry.async('uint8array')) as Uint8Array<ArrayBuffer>,
        }));
    return importEntries(entries, withoutExtension(file.name));
};

const importOne = async (file: File): Promise<SkillDraft> => {
    const lowerName = file.name.toLowerCase();
    if (file.size > MAX_SKILL_TOTAL_BYTES) {
        throw tooLarge();
    }
    if (lowerName.endsWith('.md')) {
        if (file.size > MAX_SKILL_FILE_BYTES) {
            throw tooLarge();
        }
        return draftFromMarkdown(await file.text(), []);
    }
    if (lowerName.endsWith('.zip') || lowerName.endsWith('.skill') || lowerName.endsWith('.plugin')) {
        return importArchive(file);
    }
    throw new SkillImportError(c('collider_2025:Error').t`Use a .md, .zip or .skill file, or a folder.`);
};

const toResult = async (fileName: string, run: () => Promise<SkillDraft>): Promise<SkillImportResult> => {
    try {
        return { fileName, draft: await run() };
    } catch (error) {
        return {
            fileName,
            error:
                error instanceof SkillImportError
                    ? error.message
                    : c('collider_2025:Error').t`This file could not be read.`,
        };
    }
};

export const importSkillFiles = async (files: File[]): Promise<SkillImportResult[]> =>
    Promise.all(files.map((file) => toResult(file.name, () => importOne(file))));

/** Imports a picked or dropped folder: a single skill, a folder of skills, or a Claude plugin. */
export const importSkillFolder = async (folderName: string, files: SkillFolderFile[]): Promise<SkillImportResult> =>
    toResult(folderName, async () => {
        const entries = files.filter(({ path }) => !isIgnoredBundlePath(path));
        if (entries.reduce((total, { file }) => total + file.size, 0) > MAX_SKILL_TOTAL_BYTES) {
            throw tooLarge();
        }
        return importEntries(
            entries.map(({ path, file }) => ({
                path,
                read: async () => new Uint8Array(await file.arrayBuffer()),
            })),
            folderName
        );
    });
