import { createAsyncThunk } from '@reduxjs/toolkit';

import { generateSkillKeyBase64 } from '../../crypto';
import { selectMasterKeysBundle } from '../../redux/selectors';
import type { LumoState } from '../../redux/store';
import type { LumoThunkArguments } from '../../redux/thunk';
import type { MasterKeyContext } from '../../serialization';
import { buildMasterKeyContext } from '../../util/masterKeys';
import { type DesktopConnectorState, formatSkillConnectorMap, matchSkillConnectors } from './connectorMatching';
import { customAgentToSkillDraft, getAgentsToMigrate } from './customAgentMigration';
import { BUNDLE_INDEX_VERSION, deriveBundleInfo } from './skillBundle';
import { decodeText, isSkillScriptFile, isTextSkillFile } from './skillFiles';
import {
    type SkillCommand,
    findCommandFile,
    findInvokedCommands,
    formatSkillInstructions,
    getCommandFilePaths,
    getCommandMarkdownPath,
    getLoadableCommands,
    getSkillCommands,
    limitSkillFileList,
    truncateSkillInstructions,
} from './skillInvocation';
import { parseSkillMarkdown } from './skillMarkdown';
import {
    deserializeSkill,
    deserializeSkillAsset,
    getSkillDek,
    serializeSkill,
    serializeSkillAsset,
} from './skillSerialization';
import { READ_SKILL_FILE_TOOL_NAME, type ReadFileResult } from './skillTool';
import type { SerializedSkillAsset, Skill, SkillDraft, SkillFileDraft, SkillId } from './types';

const MAX_SKILL_FILE_READ_CHARS = 20_000;

type ThunkConfig = { extra: LumoThunkArguments; state: LumoState };

const getMasterKeys = async (state: LumoState): Promise<MasterKeyContext> => {
    const bundle = selectMasterKeysBundle(state);
    if (!bundle) {
        throw new Error('Master key not available');
    }
    return buildMasterKeyContext(bundle);
};

const decryptSkillFiles = async ({ dbApi }: LumoThunkArguments, skill: Skill): Promise<SkillFileDraft[]> => {
    const dek = await getSkillDek(skill);
    const serialized = await dbApi.getSkillAssets(skill.id);
    const assets = await Promise.all(serialized.map((asset) => deserializeSkillAsset(asset, dek)));
    return assets
        .filter((asset) => asset !== null)
        .map(({ id, createdAt, path, mimeType, data }) => ({ id, createdAt, path, mimeType, data }))
        .sort((a, b) => a.path.localeCompare(b.path));
};

/** Rebuilds the sub-skill, plugin and connector index from the files of a skill saved before it existed. */
const reindexSkill = async (extra: LumoThunkArguments, masterKeys: MasterKeyContext, skill: Skill): Promise<Skill> => {
    try {
        const files = await decryptSkillFiles(extra, skill);
        const reindexed: Skill = { ...skill, ...deriveBundleInfo(files, skill.subSkills) };
        await extra.dbApi.putSkill(await serializeSkill(reindexed, masterKeys.primary));
        return reindexed;
    } catch {
        return skill;
    }
};

type LoadedSkills = { skills: Skill[]; migratedAgentIds: string[] };

const readSkills = async (extra: LumoThunkArguments, state: LumoState): Promise<LoadedSkills> => {
    const masterKeys = await getMasterKeys(state);
    const serialized = await extra.dbApi.getAllSkills();
    const decrypted = (await Promise.all(serialized.map((s) => deserializeSkill(s, masterKeys)))).filter(
        (skill): skill is Skill => skill !== null
    );
    const skills = await Promise.all(
        decrypted.map((skill) =>
            skill.bundleIndexVersion === BUNDLE_INDEX_VERSION ? skill : reindexSkill(extra, masterKeys, skill)
        )
    );
    const migratedAgentIds = new Set(
        [...serialized, ...skills].flatMap(({ legacyAgentId }) => (legacyAgentId ? [legacyAgentId] : []))
    );
    return { skills, migratedAgentIds: [...migratedAgentIds] };
};

export const loadSkills = createAsyncThunk<LoadedSkills, void, ThunkConfig>(
    'skills/load',
    async (_, { extra, getState }) => readSkills(extra, getState())
);

/** Re-reads skills after a sync changed them, without going back to the loading state. */
export const refreshSkills = createAsyncThunk<LoadedSkills, void, ThunkConfig>(
    'skills/refresh',
    async (_, { extra, getState }) => readSkills(extra, getState()),
    { condition: (_, { getState }) => getState().skills.status === 'ready' }
);

const writeSkill = async (
    { dbApi }: LumoThunkArguments,
    masterKeys: MasterKeyContext,
    skill: Skill,
    files: SkillFileDraft[]
) => {
    const dek = await getSkillDek(skill);
    const assets: SerializedSkillAsset[] = await Promise.all(
        files.map((file) =>
            serializeSkillAsset(
                {
                    id: file.id ?? crypto.randomUUID(),
                    skillId: skill.id,
                    createdAt: file.createdAt ?? skill.updatedAt,
                    updatedAt: skill.updatedAt,
                    path: file.path,
                    mimeType: file.mimeType,
                    data: file.data,
                },
                dek
            )
        )
    );
    await dbApi.putSkillWithAssets(await serializeSkill(skill, masterKeys.primary), assets);
};

const sameBytes = (a: Uint8Array<ArrayBuffer>, b: Uint8Array<ArrayBuffer>) =>
    a.length === b.length && a.every((byte, i) => byte === b[i]);

/**
 * Stored files are immutable once synced, so a file whose path or content changed gets a new id;
 * the old one is then deleted like any file removed from the bundle.
 */
const assignChangedFileIds = async (
    extra: LumoThunkArguments,
    existing: Skill | undefined,
    files: SkillFileDraft[]
): Promise<SkillFileDraft[]> => {
    if (!existing || !files.some((file) => file.id)) {
        return files;
    }
    const stored = new Map((await decryptSkillFiles(extra, existing)).map((file) => [file.id, file]));
    return files.map((file) => {
        const previous = file.id ? stored.get(file.id) : undefined;
        const unchanged =
            previous &&
            previous.path === file.path &&
            previous.mimeType === file.mimeType &&
            sameBytes(previous.data, file.data);
        return unchanged || !file.id ? file : { ...file, id: undefined, createdAt: undefined };
    });
};

/** Creates a skill when `id` is omitted, otherwise replaces its content and files. */
export const saveSkill = createAsyncThunk<Skill, { id?: SkillId; draft: SkillDraft }, ThunkConfig>(
    'skills/save',
    async ({ id, draft }, { extra, getState }) => {
        const state = getState();
        const masterKeys = await getMasterKeys(state);
        const existing = id ? state.skills.skills[id] : undefined;
        if (id && !existing) {
            throw new Error(`Skill ${id} not found`);
        }
        const now = new Date().toISOString();
        const { legacyAgentId, enabled, ...rest } = draft;
        const { files: draftFiles, ...priv } = rest;
        const files = await assignChangedFileIds(extra, existing, draftFiles);
        const skill: Skill = {
            id: existing?.id ?? crypto.randomUUID(),
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
            legacyAgentId: existing?.legacyAgentId ?? legacyAgentId,
            skillKey: existing?.skillKey ?? generateSkillKeyBase64(),
            ...priv,
            ...deriveBundleInfo(files, existing?.subSkills),
            enabled: enabled ?? existing?.enabled ?? true,
        };
        await writeSkill(extra, masterKeys, skill, files);
        return skill;
    }
);

export const setSkillEnabled = createAsyncThunk<Skill, { id: SkillId; enabled: boolean }, ThunkConfig>(
    'skills/setEnabled',
    async ({ id, enabled }, { extra, getState }) => {
        const state = getState();
        const existing = state.skills.skills[id];
        if (!existing) {
            throw new Error(`Skill ${id} not found`);
        }
        const masterKeys = await getMasterKeys(state);
        const skill: Skill = { ...existing, enabled, updatedAt: new Date().toISOString() };
        await extra.dbApi.putSkill(await serializeSkill(skill, masterKeys.primary));
        return skill;
    }
);

export const setSubSkillEnabled = createAsyncThunk<Skill, { id: SkillId; path: string; enabled: boolean }, ThunkConfig>(
    'skills/setSubSkillEnabled',
    async ({ id, path, enabled }, { extra, getState }) => {
        const state = getState();
        const existing = state.skills.skills[id];
        if (!existing) {
            throw new Error(`Skill ${id} not found`);
        }
        const masterKeys = await getMasterKeys(state);
        const skill: Skill = {
            ...existing,
            subSkills: existing.subSkills?.map((subSkill) =>
                subSkill.path === path ? { ...subSkill, enabled } : subSkill
            ),
            updatedAt: new Date().toISOString(),
        };
        await extra.dbApi.putSkill(await serializeSkill(skill, masterKeys.primary));
        return skill;
    }
);

export const deleteSkill = createAsyncThunk<SkillId, SkillId, ThunkConfig>('skills/delete', async (id, { extra }) => {
    await extra.dbApi.softDeleteSkill(id);
    return id;
});

/**
 * Decrypts the files attached to a skill. A plain thunk rather than `createAsyncThunk` so the file
 * bytes never travel through a dispatched action, where they'd be non-serializable and could be large.
 */
export const loadSkillFiles =
    (id: SkillId) =>
    async (_dispatch: unknown, getState: () => LumoState, extra: LumoThunkArguments): Promise<SkillFileDraft[]> => {
        const skill = getState().skills.skills[id];
        if (!skill) {
            throw new Error(`Skill ${id} not found`);
        }
        return decryptSkillFiles(extra, skill);
    };

/** Every sub-skill folder of a bundle, enabled or not, so file access can be scoped per sub-skill. */
const getSubSkillPaths = (skill: Skill | undefined) => skill?.subSkills?.map(({ path }) => path) ?? [];

type CommandContent = { instructions: string; files: string[] };

/** A command's SKILL.md body and the files next to it. Never rejects, so a skill problem can't block sending. */
const loadCommandContent = async (
    skills: Record<SkillId, Skill>,
    command: SkillCommand,
    loadFiles: (id: SkillId) => Promise<SkillFileDraft[]>,
    withFiles: boolean
): Promise<CommandContent> => {
    if (!command.subSkillPath && !withFiles) {
        return { instructions: skills[command.skillId]?.instructions ?? '', files: [] };
    }
    const files = await loadFiles(command.skillId).catch((): SkillFileDraft[] => []);
    const paths = withFiles ? getCommandFilePaths(command, files, getSubSkillPaths(skills[command.skillId])) : [];
    if (!command.subSkillPath) {
        return { instructions: skills[command.skillId]?.instructions ?? '', files: paths };
    }
    const markdownPath = getCommandMarkdownPath(command);
    const markdown = files.find((file) => file.path === markdownPath);
    return { instructions: markdown ? parseSkillMarkdown(decodeText(markdown.data)).body : '', files: paths };
};

const findCommand = (skills: Record<SkillId, Skill>, handle: string) =>
    getSkillCommands(Object.values(skills)).find((candidate) => candidate.handle === handle);

/** Appends which connected tools stand for the skill's `~~placeholders`, when on desktop. */
const withConnectorMap = (
    instructions: string,
    skill: Skill | undefined,
    desktopConnectors: DesktopConnectorState | undefined
) => {
    if (!instructions.trim() || !skill?.connectorCategories?.length || !desktopConnectors) {
        return instructions;
    }
    const map = formatSkillConnectorMap(matchSkillConnectors(skill, desktopConnectors));
    return map ? `${instructions}\n\n${map}` : instructions;
};

export type SkillContext = {
    /** Instructions of the skills invoked with `/handle`, ready for the system prompt. */
    instructions?: string;
    /** Enabled skills the model may load itself with the skill tool. */
    loadable: SkillCommand[];
    /** Handles of invoked skills that have files the model may read. */
    readable: string[];
};

/**
 * Skills invoked with `/handle` in `texts` and the ones the model may load. `listFiles` adds each
 * invoked skill's files to its instructions; leave it off when the file tool won't be offered.
 * `desktopConnectors` adds the connected tools for each skill's `~~placeholders`.
 */
export const resolveSkillContext = createAsyncThunk<
    SkillContext,
    { texts: string[]; listFiles: boolean; desktopConnectors?: DesktopConnectorState },
    ThunkConfig
>('skills/resolveContext', async ({ texts, listFiles, desktopConnectors }, { dispatch, getState }) => {
    const { status, skills } = getState().skills;
    if (status !== 'ready') {
        return { loadable: [], readable: [] };
    }
    const commands = getSkillCommands(Object.values(skills));
    const invoked = findInvokedCommands(commands, texts);
    const loadFiles = (id: SkillId) => dispatch(loadSkillFiles(id));
    const resolved = await Promise.all(
        invoked.map(async (command) => {
            const content = await loadCommandContent(skills, command, loadFiles, listFiles);
            return {
                handle: command.handle,
                instructions: withConnectorMap(content.instructions, skills[command.skillId], desktopConnectors),
                files: content.files,
            };
        })
    );
    return {
        instructions: formatSkillInstructions(resolved, listFiles ? READ_SKILL_FILE_TOOL_NAME : undefined),
        loadable: getLoadableCommands(commands, invoked),
        readable: resolved.filter(({ files }) => files.length).map(({ handle }) => handle),
    };
});

/** Instructions and file list of one enabled skill by handle; empty when there is no such skill. */
export const loadSkillInstructions = createAsyncThunk<
    CommandContent,
    { handle: string; desktopConnectors?: DesktopConnectorState },
    ThunkConfig
>('skills/loadInstructions', async ({ handle, desktopConnectors }, { dispatch, getState }) => {
    const { skills } = getState().skills;
    const command = findCommand(skills, handle);
    if (!command) {
        return { instructions: '', files: [] };
    }
    const { instructions, files } = await loadCommandContent(
        skills,
        command,
        (id) => dispatch(loadSkillFiles(id)),
        true
    );
    return {
        instructions: withConnectorMap(
            truncateSkillInstructions(instructions),
            skills[command.skillId],
            desktopConnectors
        ),
        files: limitSkillFileList(files),
    };
});

/**
 * Reads a text file of an enabled skill for the model. `path` resolves like a link in the skill's
 * SKILL.md (relative to its folder, `/` for the bundle root), falling back to the bundle root.
 */
export const readSkillFile = createAsyncThunk<ReadFileResult, { handle: string; path: string }, ThunkConfig>(
    'skills/readFile',
    async ({ handle, path }, { dispatch, getState }) => {
        const { skills } = getState().skills;
        const command = findCommand(skills, handle);
        if (!command) {
            return { ok: false, error: 'unknown-skill' };
        }
        const files = await dispatch(loadSkillFiles(command.skillId)).catch((): SkillFileDraft[] => []);
        const file = findCommandFile(command, files, path, getSubSkillPaths(skills[command.skillId]));
        if (!file) {
            return { ok: false, error: 'not-found' };
        }
        if (!isTextSkillFile(file.mimeType)) {
            return { ok: false, error: 'binary' };
        }
        const text = decodeText(file.data);
        return {
            ok: true,
            path: file.path,
            content: text.slice(0, MAX_SKILL_FILE_READ_CHARS),
            truncated: text.length > MAX_SKILL_FILE_READ_CHARS,
            isScript: isSkillScriptFile(file.path),
        };
    }
);

/** Turns each Custom Lumo without a skill into one. Safe to call repeatedly. */
export const migrateCustomAgentsToSkills = createAsyncThunk<number, void, ThunkConfig>(
    'skills/migrateCustomAgents',
    async (_, { dispatch, getState }) => {
        const state = getState();
        const agents = getAgentsToMigrate(
            state.lumoUserSettings.customAgents ?? [],
            new Set(state.skills.migratedAgentIds)
        );
        for (const agent of agents) {
            await dispatch(saveSkill({ draft: customAgentToSkillDraft(agent) })).unwrap();
        }
        return agents.length;
    },
    {
        condition: (_, { getState }) => {
            const { status, migrating } = getState().skills;
            return status === 'ready' && !migrating;
        },
    }
);
