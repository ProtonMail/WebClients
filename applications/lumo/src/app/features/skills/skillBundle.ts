import { decodeText } from './skillFiles';
import { SKILL_DESCRIPTION_MAX_LENGTH, SKILL_NAME_MAX_LENGTH, parseSkillMarkdown } from './skillMarkdown';
import {
    SKILL_MARKDOWN_PATH,
    type Skill,
    type SkillConnector,
    type SkillConnectorCategory,
    type SkillFileDraft,
    type SkillPluginInfo,
    type SkillSource,
    type SubSkill,
} from './types';

const PORTABLE_MANIFEST_PATH = 'plugin.json';
/** Agent Plugins (ChatGPT), Codex and Claude manifests, in order of preference. */
const PLUGIN_MANIFEST_PATHS = [PORTABLE_MANIFEST_PATH, '.codex-plugin/plugin.json', '.claude-plugin/plugin.json'];
const MCP_CONFIG_PATHS = ['mcp.json', '.mcp.json'];
export const CONNECTORS_MARKDOWN_PATH = 'CONNECTORS.md';
export const README_PATH = 'README.md';

const SUB_SKILL_SUFFIX = `/${SKILL_MARKDOWN_PATH}`;
const MAX_CONNECTORS = 50;
const MAX_CONNECTOR_CATEGORIES = 30;
const MAX_SERVERS_PER_CATEGORY = 20;

export type PluginManifest = SkillPluginInfo & { name?: string; description?: string };

const asString = (value: unknown, maxLength: number): string | undefined =>
    typeof value === 'string' && value.trim() ? value.trim().slice(0, maxLength) : undefined;

const parseJson = (text: string): unknown => {
    try {
        return JSON.parse(text);
    } catch {
        return undefined;
    }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/** OpenAI's display fields: under `extensions["com.openai"]` in Agent Plugins, at the top level in Codex. */
const getOpenAiInterface = (json: Record<string, unknown>): Record<string, unknown> => {
    const openAi = isRecord(json.extensions) ? json.extensions['com.openai'] : undefined;
    const fields = isRecord(openAi) ? openAi.interface : json.interface;
    return isRecord(fields) ? fields : {};
};

/** Reads the fields Lumo shows from a Claude, Codex or Agent Plugins `plugin.json`; anything else stays in the file. */
export const parsePluginManifest = (text: string): PluginManifest | undefined => {
    const json = parseJson(text);
    if (!isRecord(json)) {
        return undefined;
    }
    const display = getOpenAiInterface(json);
    const author = isRecord(json.author) ? json.author.name : json.author;
    return {
        name: asString(display.displayName, SKILL_NAME_MAX_LENGTH) ?? asString(json.name, SKILL_NAME_MAX_LENGTH),
        description:
            asString(json.description, SKILL_DESCRIPTION_MAX_LENGTH) ??
            asString(display.shortDescription, SKILL_DESCRIPTION_MAX_LENGTH),
        version: asString(json.version, 32),
        author: asString(author, 128) ?? asString(display.developerName, 128),
    };
};

export const isPluginManifestPath = (path: string) => PLUGIN_MANIFEST_PATHS.includes(path);

const findFile = (files: SkillFileDraft[], path: string) => files.find((file) => file.path === path);

const declaresAgentPluginsSchema = (file: SkillFileDraft) => {
    const json = parseJson(decodeText(file.data));
    return isRecord(json) && typeof json.$schema === 'string' && json.$schema.includes('agent-plugins.org');
};

/**
 * A root `plugin.json` is only a manifest when it says so or sits next to sub-skills, so a single skill
 * that ships an unrelated `plugin.json` stays a single skill.
 */
export const findPluginManifestFile = (files: SkillFileDraft[]): SkillFileDraft | undefined => {
    const hasSubSkills = files.some((file) => isSubSkillMarkdownPath(file.path));
    return PLUGIN_MANIFEST_PATHS.map((path) => findFile(files, path)).find(
        (file) => !!file && (file.path !== PORTABLE_MANIFEST_PATH || hasSubSkills || declaresAgentPluginsSchema(file))
    );
};

/** The file listing a plugin's MCP servers: the manifest itself, the file it points to, or `mcp.json`. */
export const findMcpConfigFile = (files: SkillFileDraft[]): SkillFileDraft | undefined => {
    const manifestFile = findPluginManifestFile(files);
    const manifest = manifestFile ? parseJson(decodeText(manifestFile.data)) : undefined;
    const declared = isRecord(manifest) ? manifest.mcpServers : undefined;
    if (manifestFile && isRecord(declared)) {
        return manifestFile;
    }
    const declaredFile = typeof declared === 'string' ? findFile(files, declared.replace(/^\.\//, '')) : undefined;
    return declaredFile ?? MCP_CONFIG_PATHS.map((path) => findFile(files, path)).find(Boolean);
};

/** Lists the MCP servers in an MCP config or a manifest's `mcpServers`. Only https URLs are kept; credentials in the file are ignored. */
export const parseMcpConnectors = (text: string): SkillConnector[] => {
    const json = parseJson(text);
    const servers = isRecord(json) && isRecord(json.mcpServers) ? json.mcpServers : {};
    return Object.entries(servers)
        .slice(0, MAX_CONNECTORS)
        .map(([name, config]): SkillConnector => {
            const url = isRecord(config) ? asString(config.url, 2048) : undefined;
            return { name: name.slice(0, 128), url: url?.startsWith('https://') ? url : undefined };
        });
};

const splitTableRow = (line: string): string[] | undefined => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) {
        return undefined;
    }
    return trimmed
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((cell) => cell.trim());
};

const isTableSeparator = (cells: string[]) => cells.every((cell) => /^:?-{3,}:?$/.test(cell));

const plainCellText = (cell: string) =>
    cell
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/\\(\S)/g, '$1')
        .replace(/[`*_†‡]/g, '')
        .trim();

const EMPTY_CELL = /^(?:[-—–]+|n\/?a|none)$/i;

/** Splits on commas outside parentheses, so `Atlassian (Jira, Confluence)` stays one name. */
const splitServerNames = (cell: string): string[] => {
    const names: string[] = [];
    let depth = 0;
    let current = '';
    for (const char of plainCellText(cell)) {
        if (char === '(') depth++;
        if (char === ')') depth = Math.max(0, depth - 1);
        if (char === ',' && depth === 0) {
            names.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    names.push(current);
    return names
        .map((name) => name.trim())
        .filter((name) => name && !EMPTY_CELL.test(name))
        .slice(0, MAX_SERVERS_PER_CATEGORY)
        .map((name) => name.slice(0, 128));
};

/**
 * Reads the category table of a Claude plugin's `CONNECTORS.md`: one row per kind of tool, with the
 * placeholder its skills use, the servers it sets up and the alternatives.
 */
export const parseConnectorsMarkdown = (text: string): SkillConnectorCategory[] => {
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length - 1; i++) {
        const header = splitTableRow(lines[i])?.map((cell) => plainCellText(cell).toLowerCase());
        const separator = splitTableRow(lines[i + 1]);
        if (!header || !separator || !isTableSeparator(separator)) {
            continue;
        }
        const column = (pattern: RegExp) => header.findIndex((cell) => pattern.test(cell));
        const nameColumn = column(/categor/);
        const placeholderColumn = column(/placeholder/);
        if (nameColumn < 0 || placeholderColumn < 0) {
            continue;
        }
        const includedColumn = column(/included|servers/);
        const alternativesColumn = column(/other|alternative/);

        const categories: SkillConnectorCategory[] = [];
        for (const line of lines.slice(i + 2)) {
            const cells = splitTableRow(line);
            if (!cells || categories.length >= MAX_CONNECTOR_CATEGORIES) {
                break;
            }
            const name = plainCellText(cells[nameColumn] ?? '').slice(0, 128);
            if (!name) {
                continue;
            }
            const placeholder = plainCellText(cells[placeholderColumn] ?? '').slice(0, 128);
            categories.push({
                name,
                placeholder: placeholder.startsWith('~~') ? placeholder : undefined,
                included: includedColumn < 0 ? [] : splitServerNames(cells[includedColumn] ?? ''),
                alternatives: alternativesColumn < 0 ? [] : splitServerNames(cells[alternativesColumn] ?? ''),
            });
        }
        return categories;
    }
    return [];
};

export const isSubSkillMarkdownPath = (path: string) => path.endsWith(SUB_SKILL_SUFFIX);

export const getSubSkillMarkdownPath = (subSkill: Pick<SubSkill, 'path'>) => `${subSkill.path}${SUB_SKILL_SUFFIX}`;

const folderName = (path: string) => path.split('/').pop() ?? path;

/** Sub-skills in a bundle, sorted by name. `previous` keeps the user's on/off choices across saves. */
export const findSubSkills = (files: SkillFileDraft[], previous: SubSkill[] = []): SubSkill[] => {
    const enabledByPath = new Map(previous.map(({ path, enabled }) => [path, enabled]));
    return files
        .filter((file) => isSubSkillMarkdownPath(file.path))
        .map((file) => {
            const path = file.path.slice(0, -SUB_SKILL_SUFFIX.length);
            const { frontmatter } = parseSkillMarkdown(decodeText(file.data));
            return {
                path,
                name: asString(frontmatter.name, SKILL_NAME_MAX_LENGTH) ?? folderName(path),
                description: asString(frontmatter.description, SKILL_DESCRIPTION_MAX_LENGTH) ?? '',
                enabled: enabledByPath.get(path) ?? true,
            };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
};

export const BUNDLE_INDEX_VERSION = 3;

/** The fields of a skill that come from its files rather than from the editor. */
export const deriveBundleInfo = (
    files: SkillFileDraft[],
    previousSubSkills?: SubSkill[]
): Pick<Skill, 'subSkills' | 'plugin' | 'connectors' | 'connectorCategories' | 'bundleIndexVersion'> => {
    const manifestFile = findPluginManifestFile(files);
    const mcpFile = findMcpConfigFile(files);
    const connectorsFile = findFile(files, CONNECTORS_MARKDOWN_PATH);
    const manifest = manifestFile ? parsePluginManifest(decodeText(manifestFile.data)) : undefined;
    const subSkills = findSubSkills(files, previousSubSkills);
    const connectors = mcpFile ? parseMcpConnectors(decodeText(mcpFile.data)) : [];
    const connectorCategories = connectorsFile ? parseConnectorsMarkdown(decodeText(connectorsFile.data)) : [];
    return {
        subSkills: subSkills.length ? subSkills : undefined,
        plugin: manifest ? { version: manifest.version, author: manifest.author } : undefined,
        connectors: connectors.length ? connectors : undefined,
        connectorCategories: connectorCategories.length ? connectorCategories : undefined,
        bundleIndexVersion: BUNDLE_INDEX_VERSION,
    };
};

/** Proton plugins have no manifest file, so they keep the plugin info stored on the skill. */
export const resolvePluginInfo = (
    source: SkillSource,
    fromFiles: SkillPluginInfo | undefined,
    stored: SkillPluginInfo | undefined
): SkillPluginInfo | undefined => fromFiles ?? (source === 'proton' ? stored : undefined);

/** A plugin bundles several skills, and may have no root SKILL.md of its own. */
export const isSkillPlugin = (skill: Pick<Skill, 'plugin' | 'subSkills'>) =>
    !!skill.plugin || (skill.subSkills?.length ?? 0) > 0;

/** Whether the bundle has a root SKILL.md to show and edit. */
export const hasRootSkillMarkdown = (skill: Pick<Skill, 'plugin' | 'subSkills' | 'instructions'>) =>
    !isSkillPlugin(skill) || !!skill.instructions.trim();
