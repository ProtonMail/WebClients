import { getSubSkillMarkdownPath, hasRootSkillMarkdown } from './skillBundle';
import { resolveSkillLink } from './skillLinks';
import { foldSkillHandleText, getSkillHandle } from './skillMarkdown';
import { SKILL_MARKDOWN_PATH, type Skill, type SkillFileDraft, type SkillId } from './types';

/** A skill the user can invoke by typing `/handle` in the composer. */
export type SkillCommand = {
    handle: string;
    name: string;
    description: string;
    skillId: SkillId;
    /** Set for a sub-skill of a plugin: the folder holding its SKILL.md. */
    subSkillPath?: string;
    /** The plugin a sub-skill belongs to, used to group the menu. */
    group?: string;
};

const MAX_MENU_ITEMS = 50;
const MAX_INVOKED_SKILLS = 5;
const MAX_SKILL_INSTRUCTION_CHARS = 20_000;
const MAX_CATALOGUE_SKILLS = 50;
const MAX_CATALOGUE_DESCRIPTION_CHARS = 200;
const MAX_LISTED_FILES = 100;

/** A `/handle` token: a letter or digit of any script, then letters, digits, marks or hyphens. */
const HANDLE_TOKEN = String.raw`[\p{L}\p{N}][\p{L}\p{M}\p{N}-]*`;
const TOKEN_END = String.raw`(?=$|[\s.,;:!?)。，、；：！？）])`;

/** Every enabled skill and enabled sub-skill of an enabled plugin, root skills first, including clashing handles. */
const collectSkillCommands = (skills: Skill[]): SkillCommand[] => {
    const enabled = skills.filter((skill) => skill.enabled);
    const roots = enabled.filter(hasRootSkillMarkdown).map((skill): SkillCommand => ({
        handle: getSkillHandle(skill.name),
        name: skill.name,
        description: skill.description,
        skillId: skill.id,
    }));
    const subSkills = enabled.flatMap((skill) =>
        (skill.subSkills ?? [])
            .filter((subSkill) => subSkill.enabled)
            .map((subSkill): SkillCommand => ({
                handle: getSkillHandle(subSkill.name),
                name: subSkill.name,
                description: subSkill.description,
                skillId: skill.id,
                subSkillPath: subSkill.path,
                group: skill.name,
            }))
    );
    return [...roots, ...subSkills];
};

/** Enabled skills and the enabled sub-skills of enabled plugins. The first skill to claim a handle keeps it. */
export const getSkillCommands = (skills: Skill[]): SkillCommand[] => {
    const seen = new Set<string>();
    return collectSkillCommands(skills).filter(({ handle }) => {
        if (!handle || seen.has(handle)) {
            return false;
        }
        seen.add(handle);
        return true;
    });
};

/** Handles of one skill or plugin that another enabled skill also uses, so only the first of them can be invoked. */
export const findSharedHandles = (skills: Skill[], skillId: SkillId): string[] => {
    const commands = collectSkillCommands(skills).filter(({ handle }) => handle);
    const shared = commands.filter(
        (command) =>
            command.skillId === skillId &&
            commands.some((other) => other !== command && other.handle === command.handle)
    );
    return Array.from(new Set(shared.map(({ handle }) => handle)));
};

/** Whether a name would give the same handle as another enabled skill than `skillId`. */
export const isSkillHandleTaken = (name: string, skills: Skill[], skillId?: SkillId): boolean => {
    const handle = getSkillHandle(name);
    return (
        !!handle &&
        collectSkillCommands(skills).some((command) => command.skillId !== skillId && command.handle === handle)
    );
};

/** Handles starting with the query come first, then handles or descriptions containing it. Order is kept within a tier. */
export const filterSkillCommands = (commands: SkillCommand[], query: string): SkillCommand[] => {
    const normalized = foldSkillHandleText(query);
    if (!normalized) {
        return commands.slice(0, MAX_MENU_ITEMS);
    }
    const rank = ({ handle, description }: SkillCommand) => {
        if (handle.startsWith(normalized)) return 2;
        if (handle.includes(normalized) || foldSkillHandleText(description).includes(normalized)) return 1;
        return 0;
    };
    return commands
        .map((command) => ({ command, rank: rank(command) }))
        .filter(({ rank }) => rank > 0)
        .sort((a, b) => b.rank - a.rank)
        .slice(0, MAX_MENU_ITEMS)
        .map(({ command }) => command);
};

/** Standalone skills first, then each plugin's sub-skills together, keeping match order inside each group. */
export const groupSkillCommands = (commands: SkillCommand[]): SkillCommand[] => {
    const groups = new Map<string, SkillCommand[]>();
    for (const command of commands) {
        const key = command.group ?? '';
        const group = groups.get(key) ?? [];
        group.push(command);
        groups.set(key, group);
    }
    const standalone = groups.get('') ?? [];
    groups.delete('');
    return [...standalone, ...Array.from(groups.values()).flat()];
};

/** The `/query` being typed just before the cursor, if any. A slash only counts at the start or after whitespace. */
export const findSlashQuery = (textBeforeCursor: string): { query: string; start: number } | undefined => {
    const match = /(^|\s)\/([\p{L}\p{M}\p{N}-]*)$/u.exec(textBeforeCursor);
    if (!match) {
        return undefined;
    }
    return { query: match[2], start: match.index + match[1].length };
};

/** Every `/handle` token in a message, normalised like skill names, in order, without duplicates. */
export const findInvokedHandles = (text: string): string[] => {
    const pattern = new RegExp(String.raw`(?:^|\s)\/(${HANDLE_TOKEN})${TOKEN_END}`, 'gu');
    const handles = Array.from(text.matchAll(pattern), (match) => getSkillHandle(match[1])).filter(Boolean);
    return Array.from(new Set(handles));
};

/** Splits a draft into plain text and `/handle` tokens for known skills, for highlighting. */
export const splitSkillTokens = (text: string, handles: ReadonlySet<string>): { text: string; isSkill: boolean }[] => {
    const parts: { text: string; isSkill: boolean }[] = [];
    let last = 0;
    for (const match of text.matchAll(new RegExp(String.raw`(^|\s)(\/(${HANDLE_TOKEN}))${TOKEN_END}`, 'gu'))) {
        if (!handles.has(getSkillHandle(match[3]))) {
            continue;
        }
        const start = match.index + match[1].length;
        if (start > last) {
            parts.push({ text: text.slice(last, start), isSkill: false });
        }
        parts.push({ text: match[2], isSkill: true });
        last = start + match[2].length;
    }
    if (last < text.length) {
        parts.push({ text: text.slice(last), isSkill: false });
    }
    return parts;
};

/** Puts `/handle ` at the start of a draft, unless the draft already invokes that skill. */
export const prependSkillHandle = (text: string, handle: string): string => {
    if (findInvokedHandles(text).includes(getSkillHandle(handle))) {
        return text;
    }
    const rest = text.trimStart();
    return rest ? `/${handle} ${rest}` : `/${handle} `;
};

/** Commands invoked across messages, oldest first, capped so a long chat can't flood the request. */
export const findInvokedCommands = (commands: SkillCommand[], texts: string[]): SkillCommand[] => {
    const byHandle = new Map(commands.map((command) => [command.handle, command]));
    const invoked = new Map<string, SkillCommand>();
    for (const handle of texts.flatMap(findInvokedHandles)) {
        const command = byHandle.get(handle);
        if (command && !invoked.has(handle)) {
            invoked.set(handle, command);
        }
    }
    return Array.from(invoked.values()).slice(-MAX_INVOKED_SKILLS);
};

export const truncateSkillInstructions = (instructions: string): string =>
    instructions.trim().slice(0, MAX_SKILL_INSTRUCTION_CHARS);

/** The SKILL.md a command reads from; relative paths in its instructions resolve against its folder. */
export const getCommandMarkdownPath = ({ subSkillPath }: Pick<SkillCommand, 'subSkillPath'>) =>
    subSkillPath ? getSubSkillMarkdownPath({ path: subSkillPath }) : SKILL_MARKDOWN_PATH;

/** The deepest sub-skill folder holding a file, or undefined for a file shared by the whole bundle. */
const findOwningSubSkill = (path: string, subSkillPaths: string[]): string | undefined =>
    subSkillPaths
        .filter((folder) => path.startsWith(`${folder}/`))
        .reduce<string | undefined>(
            (deepest, folder) => (!deepest || folder.length > deepest.length ? folder : deepest),
            undefined
        );

/**
 * Files a command may read: its own folder's, plus the bundle's shared files outside every sub-skill
 * folder. Files of other sub-skills stay out of reach, so a disabled one is never exposed to the model.
 */
const getCommandScope = <T extends Pick<SkillFileDraft, 'path'>>(
    { subSkillPath }: Pick<SkillCommand, 'subSkillPath'>,
    files: T[],
    subSkillPaths: string[]
): T[] => files.filter(({ path }) => findOwningSubSkill(path, subSkillPaths) === subSkillPath);

const getSharedFiles = <T extends Pick<SkillFileDraft, 'path'>>(files: T[], subSkillPaths: string[]): T[] =>
    files.filter(({ path }) => findOwningSubSkill(path, subSkillPaths) === undefined);

/**
 * Files listed for a command, relative to its folder: a root skill's are the bundle's shared files,
 * a sub-skill's are those in its own folder. `subSkillPaths` are every sub-skill folder in the bundle.
 */
export const getCommandFilePaths = (
    command: Pick<SkillCommand, 'subSkillPath'>,
    files: Pick<SkillFileDraft, 'path'>[],
    subSkillPaths: string[]
): string[] => {
    const { subSkillPath } = command;
    const own = getCommandScope(command, files, subSkillPaths);
    if (!subSkillPath) {
        return own.map(({ path }) => path);
    }
    const prefix = `${subSkillPath}/`;
    const markdownPath = getSubSkillMarkdownPath({ path: subSkillPath });
    return own.filter(({ path }) => path !== markdownPath).map(({ path }) => path.slice(prefix.length));
};

/**
 * The bundle file a model-supplied path points to. It resolves like a link in the command's SKILL.md
 * (relative to its folder, `/` for the bundle root), then against the bundle root, and never escapes the
 * bundle. Only the command's own files and the bundle's shared files can be reached.
 */
export const findCommandFile = <T extends Pick<SkillFileDraft, 'path'>>(
    command: Pick<SkillCommand, 'subSkillPath'>,
    allFiles: T[],
    path: string,
    subSkillPaths: string[]
): T | undefined => {
    const own = getCommandScope(command, allFiles, subSkillPaths);
    const files = command.subSkillPath ? [...own, ...getSharedFiles(allFiles, subSkillPaths)] : own;
    const paths = files.map((file) => file.path);
    const fromSkill = resolveSkillLink(getCommandMarkdownPath(command), path, paths);
    const target = fromSkill.kind === 'file' ? fromSkill : resolveSkillLink(SKILL_MARKDOWN_PATH, path, paths);
    return target.kind === 'file' ? files.find((file) => file.path === target.path) : undefined;
};

/** Caps a skill's file list so a large bundle can't flood the request. */
export const limitSkillFileList = (paths: string[]): string[] => paths.slice(0, MAX_LISTED_FILES);

/**
 * The instructions of invoked skills, for the system prompt. When `readFileToolName` is set, each
 * skill's files are listed so the model can read the ones its instructions refer to.
 */
export const formatSkillInstructions = (
    skills: { handle: string; instructions: string; files?: string[] }[],
    readFileToolName?: string
): string | undefined => {
    const parts = skills
        .filter(({ instructions }) => instructions.trim())
        .map(({ handle, instructions, files = [] }) => {
            const listed = readFileToolName ? limitSkillFileList(files) : [];
            const fileNote = listed.length
                ? `\nFiles in this skill (read one with the ${readFileToolName} tool when the instructions refer to it; scripts can't be run): ${listed.join(', ')}`
                : '';
            return `[Skill /${handle}: the user invoked this skill. Follow its instructions.\n${truncateSkillInstructions(instructions)}${fileNote}]`;
        });
    return parts.length ? parts.join('\n\n') : undefined;
};

/** Skills the model may load on its own: every enabled one the user hasn't already invoked, capped. */
export const getLoadableCommands = (commands: SkillCommand[], invoked: SkillCommand[]): SkillCommand[] => {
    const invokedHandles = new Set(invoked.map(({ handle }) => handle));
    return commands.filter(({ handle }) => !invokedHandles.has(handle)).slice(0, MAX_CATALOGUE_SKILLS);
};

/** Lists loadable skills by name and short description, so the model knows when to call `toolName`. */
export const formatSkillCatalogue = (commands: SkillCommand[], toolName: string): string | undefined => {
    if (!commands.length) {
        return undefined;
    }
    const lines = commands.map(({ handle, description }) => {
        const summary = description.replace(/\s+/g, ' ').trim().slice(0, MAX_CATALOGUE_DESCRIPTION_CHARS);
        return summary ? `- ${handle}: ${summary}` : `- ${handle}`;
    });
    return (
        `[Available skills: the user has set up these skills. When a request clearly matches one, call the ` +
        `${toolName} tool with its name before answering, then follow the instructions it returns. Load only ` +
        `the skills you need, and don't mention skills or tools unless the user asks.\n${lines.join('\n')}]`
    );
};
