import type { Base64, EncryptedData } from '../../types';

export type SkillId = string;
type SkillAssetId = string;

/** The entry point of every skill bundle, as in the Claude skill format. */
export const SKILL_MARKDOWN_PATH = 'SKILL.md';

export type SkillSource = 'created' | 'uploaded' | 'custom-lumo' | 'proton';

/**
 * Cleartext metadata. Kept to what a server needs to store, order and sync a skill; everything
 * user-authored goes in `SkillPriv`. `legacyAgentId` survives deletion so the Custom Lumo
 * migration never resurrects a skill the user removed.
 */
export type SkillPub = {
    id: SkillId;
    createdAt: string;
    updatedAt: string;
    legacyAgentId?: string;
};

/** A skill nested in a bundle, such as `skills/ux-copy/SKILL.md` in a Claude plugin. */
export type SubSkill = {
    /** Folder holding the sub-skill's SKILL.md, relative to the bundle root. */
    path: string;
    name: string;
    description: string;
    enabled: boolean;
};

/** An MCP server a plugin asks for in its `.mcp.json`. */
export type SkillConnector = {
    name: string;
    url?: string;
};

/** A kind of tool a plugin works with: one row of its `CONNECTORS.md`. */
export type SkillConnectorCategory = {
    name: string;
    /** How the plugin's skills refer to the category, e.g. `~~chat`. */
    placeholder?: string;
    /** Servers the plugin sets up in its `.mcp.json`. */
    included: string[];
    /** Other servers that do the same job. */
    alternatives: string[];
};

/** From `.claude-plugin/plugin.json`. */
export type SkillPluginInfo = {
    version?: string;
    author?: string;
};

/**
 * The encrypted JSON blob. `instructions` is the body of the root SKILL.md, without its frontmatter;
 * plugins may have none. `subSkills`, `plugin`, `connectors` and `connectorCategories` are derived from
 * the files on save.
 */
export type SkillPriv = {
    name: string;
    description: string;
    instructions: string;
    icon?: string;
    enabled: boolean;
    source: SkillSource;
    /** Frontmatter keys other than name and description, preserved from uploads. */
    metadata?: Record<string, string>;
    conversationStarters?: string[];
    subSkills?: SubSkill[];
    plugin?: SkillPluginInfo;
    connectors?: SkillConnector[];
    connectorCategories?: SkillConnectorCategory[];
    /** Which version of the file index produced the four fields above; older skills are re-indexed on load. */
    bundleIndexVersion?: number;
};

type DerivedSkillFields =
    'enabled' | 'subSkills' | 'plugin' | 'connectors' | 'connectorCategories' | 'bundleIndexVersion';

export type SkillKeyClear = {
    skillKey: Base64;
};

export type Skill = SkillPub & SkillPriv & SkillKeyClear;

type LocalSyncFlags = {
    dirty?: boolean;
};

export type SerializedSkill = SkillPub &
    LocalSyncFlags &
    ({ deleted?: false; wrappedSkillKey: Base64; encrypted: EncryptedData } | { deleted: true });

/** Cleartext metadata of a file attached to a skill. The path is private, so it is encrypted. */
export type SkillAssetPub = {
    id: SkillAssetId;
    skillId: SkillId;
    createdAt: string;
    updatedAt: string;
};

export type SkillAssetPriv = {
    path: string;
    mimeType: string;
    data: Uint8Array<ArrayBuffer>;
};

export type SkillAsset = SkillAssetPub & SkillAssetPriv;

export type SerializedSkillAsset = SkillAssetPub &
    LocalSyncFlags &
    ({ deleted?: false; encrypted: EncryptedData } | { deleted: true });

/** A file as edited in the UI. SKILL.md is never one of these: it maps onto the skill itself. */
export type SkillFileDraft = {
    /** Set for files that are already stored, so saving keeps their asset id. */
    id?: SkillAssetId;
    createdAt?: string;
    path: string;
    mimeType: string;
    data: Uint8Array<ArrayBuffer>;
};

export type SkillDraft = Omit<SkillPriv, DerivedSkillFields> & {
    enabled?: boolean;
    files: SkillFileDraft[];
    legacyAgentId?: string;
};
