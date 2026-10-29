import type {
    DesktopCatalogEntry,
    DesktopConnector,
    DesktopConnectorCatalog,
} from '@proton/lumo-api-client/core/desktop-tools';

import { type DesktopConnectorCategory, getDesktopCategory } from './connectorCategories';
import type { Skill, SkillConnector, SkillConnectorCategory } from './types';

/**
 * - `connected`: added in Lumo Desktop and usable.
 * - `needs-attention`: added, but turned off or not signed in.
 * - `available`: Lumo Desktop can set it up; the user hasn't.
 * - `unavailable`: Lumo Desktop has nothing for it.
 */
type SkillConnectorStatus = 'connected' | 'needs-attention' | 'available' | 'unavailable';

export type SkillConnectorMatch = {
    /** As the plugin names it, or the desktop name for connectors the plugin doesn't name. */
    name: string;
    status: SkillConnectorStatus;
    /** The desktop connector to open in settings. Absent when unavailable. */
    connectorId?: string;
    /** What Lumo Desktop calls it, when known. */
    desktopName?: string;
};

export type SkillCategoryMatch = {
    category: SkillConnectorCategory;
    desktopCategory?: DesktopConnectorCategory;
    /** The plugin's servers for this category, then the alternatives the user has or could add. */
    connectors: SkillConnectorMatch[];
    /** Connected connectors in the same desktop category that the plugin doesn't name. */
    otherConnected: SkillConnectorMatch[];
    /** Connectors in the same desktop category that the user could add. */
    suggested: SkillConnectorMatch[];
};

export type SkillConnectorMatches = {
    categories: SkillCategoryMatch[];
    /** Servers in the plugin's `.mcp.json` that no category names. */
    servers: SkillConnectorMatch[];
};

export type DesktopConnectorState = {
    manifests: DesktopConnector[];
    catalog: DesktopConnectorCatalog;
};

const MCP_ID_PREFIX = 'mcp-';

/** Products a plugin may name that Lumo Desktop reaches through another connector. */
const PRODUCT_ALIASES: Record<string, string> = {
    jira: 'atlassian',
    confluence: 'atlassian',
    gdrive: 'googledrive',
};

const normalizeName = (name: string) =>
    name
        .normalize('NFKD')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '');

/** `Atlassian (Jira/Confluence)` is known as atlassian, jira and confluence. */
const getNameKeys = (name: string): string[] => {
    const base = name.replace(/\([^)]*\)/g, ' ');
    const aliases = Array.from(name.matchAll(/\(([^)]*)\)/g), (match) => match[1].split(/[/,;&]|\band\b/)).flat();
    const keys = [base, ...aliases].map(normalizeName).filter(Boolean);
    return [...keys, ...keys.flatMap((key) => (PRODUCT_ALIASES[key] ? [PRODUCT_ALIASES[key]] : []))];
};

const getHost = (url: string | undefined) => {
    if (!url) return undefined;
    try {
        return new URL(url).host;
    } catch {
        return undefined;
    }
};

const stripMcpPrefix = (id: string) => (id.startsWith(MCP_ID_PREFIX) ? id.slice(MCP_ID_PREFIX.length) : id);

/** Tools of a connector that is turned on and signed in are offered to the model. */
const isDesktopConnectorConnected = (manifest: DesktopConnector) =>
    manifest.enabled !== false && manifest.readiness?.state !== 'blocked' && manifest.status?.state !== 'not_ready';

type Candidate = {
    id: string;
    name: string;
    category?: string;
    keys: Set<string>;
    host?: string;
    manifest?: DesktopConnector;
};

const toCandidates = ({ manifests, catalog }: DesktopConnectorState): Candidate[] => {
    const catalogById = new Map(catalog.connectors.map((entry) => [entry.id, entry]));
    const fromManifests = manifests.map((manifest): Candidate => {
        const entry = catalogById.get(manifest.id);
        return {
            id: manifest.id,
            name: manifest.display_name,
            category: manifest.category ?? entry?.category,
            keys: new Set(
                [manifest.server_id ?? stripMcpPrefix(manifest.id), manifest.display_name, entry?.name]
                    .filter((key): key is string => !!key)
                    .map(normalizeName)
            ),
            host: getHost(manifest.url ?? entry?.url),
            manifest,
        };
    });
    const added = new Set(manifests.map((manifest) => manifest.id));
    const fromCatalog = catalog.connectors
        .filter((entry) => !added.has(entry.id))
        .map((entry: DesktopCatalogEntry): Candidate => ({
            id: entry.id,
            name: entry.name,
            category: entry.category,
            keys: new Set([entry.server_id ?? stripMcpPrefix(entry.id), entry.name].map(normalizeName)),
            host: getHost(entry.url),
        }));
    return [...fromManifests, ...fromCatalog];
};

const getStatus = (candidate: Candidate): SkillConnectorStatus => {
    if (!candidate.manifest) return 'available';
    return isDesktopConnectorConnected(candidate.manifest) ? 'connected' : 'needs-attention';
};

const toMatch = (name: string, candidate: Candidate | undefined): SkillConnectorMatch =>
    candidate
        ? { name, status: getStatus(candidate), connectorId: candidate.id, desktopName: candidate.name }
        : { name, status: 'unavailable' };

const dedupeByConnector = (matches: SkillConnectorMatch[]) => {
    const seen = new Set<string>();
    return matches.filter((match) => {
        const key = match.connectorId ?? `name:${normalizeName(match.name)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

/**
 * Pairs the connectors a plugin asks for with the user's Lumo Desktop connectors: by server id or
 * name first, then by URL host, then by desktop category for kinds of tools the plugin doesn't pin
 * down. Works with older desktop builds that send no category, server id or URL, matching on ids
 * and names alone.
 */
export const matchSkillConnectors = (
    skill: Pick<Skill, 'connectors' | 'connectorCategories'>,
    desktop: DesktopConnectorState
): SkillConnectorMatches => {
    const candidates = toCandidates(desktop);
    const findByName = (name: string) => {
        const keys = getNameKeys(name);
        return candidates.find((candidate) => keys.some((key) => candidate.keys.has(key)));
    };
    const findServer = (server: SkillConnector) => {
        const host = getHost(server.url);
        return findByName(server.name) ?? (host ? candidates.find((candidate) => candidate.host === host) : undefined);
    };

    const categories = (skill.connectorCategories ?? []).map((category): SkillCategoryMatch => {
        const desktopCategory = getDesktopCategory(category);
        const connectors = dedupeByConnector([
            ...category.included.map((name) => toMatch(name, findByName(name))),
            ...category.alternatives
                .map((name) => toMatch(name, findByName(name)))
                .filter((match) => match.status !== 'unavailable'),
        ]);
        const named = new Set(connectors.map((match) => match.connectorId));
        const inCategory = desktopCategory
            ? candidates.filter((candidate) => candidate.category === desktopCategory && !named.has(candidate.id))
            : [];
        return {
            category,
            desktopCategory,
            connectors,
            otherConnected: inCategory
                .filter((candidate) => getStatus(candidate) === 'connected')
                .map((candidate) => toMatch(candidate.name, candidate)),
            suggested: inCategory
                .filter((candidate) => !candidate.manifest)
                .map((candidate) => toMatch(candidate.name, candidate)),
        };
    });

    const namedInCategories = new Set(
        (skill.connectorCategories ?? []).flatMap((category) =>
            [...category.included, ...category.alternatives].flatMap(getNameKeys)
        )
    );
    const servers = (skill.connectors ?? [])
        .filter((server) => !getNameKeys(server.name).some((key) => namedInCategories.has(key)))
        .map((server) => toMatch(server.name, findServer(server)));

    return { categories, servers };
};

/** Connected connectors standing in for a category, the plugin's own first. */
export const getConnectedForCategory = (match: SkillCategoryMatch): SkillConnectorMatch[] => [
    ...match.connectors.filter((connector) => connector.status === 'connected'),
    ...match.otherConnected,
];

/**
 * Tells the model which connected tools stand for each `~~placeholder` in the skill. Only names and
 * connector ids; tool names are `<connector id>__<tool>`.
 */
export const formatSkillConnectorMap = (matches: SkillConnectorMatches): string | undefined => {
    const lines = matches.categories.flatMap(({ category, ...match }) => {
        if (!category.placeholder) return [];
        const connected = getConnectedForCategory({ category, ...match });
        if (!connected.length) {
            return [`- ${category.placeholder}: none connected. Ask the user, or continue without it.`];
        }
        const list = connected
            .map((connector) => `${connector.desktopName ?? connector.name} (tools ${connector.connectorId}__*)`)
            .join(', ');
        return [`- ${category.placeholder}: ${list}`];
    });
    if (!lines.length) return undefined;
    return [
        "When this skill needs one of these kinds of tool, or writes its ~~placeholder, use the user's connected tools for it:",
        ...lines,
    ].join('\n');
};
