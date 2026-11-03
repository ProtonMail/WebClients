import { c } from 'ttag';

import { decodeText, isSkillScriptFile, isTextSkillFile } from './skillFiles';
import { SKILL_MARKDOWN_PATH, type SkillDraft } from './types';

/**
 * A basic, local check of an uploaded skill's text for common ways a skill can misuse the model or
 * leak data. Pattern matching only: it flags things to review and never proves a skill is safe.
 */

export type SkillCheckFindingKind =
    | 'hidden-text'
    | 'instruction-override'
    | 'secret'
    | 'risky-command'
    | 'encoded-blob'
    | 'remote-image'
    | 'local-mcp-server'
    | 'insecure-mcp-server';

type SkillCheckFinding = {
    kind: SkillCheckFindingKind;
    path: string;
    /** 1-based line of the first match, for text files. */
    line?: number;
    count: number;
};

export type SkillCheckReport = {
    findings: SkillCheckFinding[];
    /** Text files read by the check, SKILL.md included. */
    checkedFileCount: number;
    scriptCount: number;
    /** Names of the MCP servers the plugin's `.mcp.json` sets up. */
    connectors: string[];
    /** External domains the skill's text links to, sorted. Connector URLs are not included. */
    linkDomains: string[];
};

const MCP_CONFIG_PATH = '.mcp.json';
const MAX_LINK_DOMAINS = 20;

type TextPattern = {
    kind: SkillCheckFindingKind;
    pattern: RegExp;
    /** Matches removed before `pattern` runs. They must not span lines, so line numbers stay right. */
    allow?: RegExp;
    skip?: (path: string) => boolean;
};

const TEXT_PATTERNS: TextPattern[] = [
    {
        kind: 'hidden-text',
        // Zero-width space, bidi overrides and isolates, invisible operators and tag characters hide text
        // from a human reader. ZWJ, ZWNJ, LRM and RLM are left out: emoji, Arabic, Hebrew and Persian use them.
        pattern: /[\u200B\u202A-\u202E\u2060-\u2064\u2066-\u2069]|[\u{E0000}-\u{E007F}]/gu,
        // Subdivision flags (Scotland, Wales…) are a black flag, a short region code in tag lowercase
        // letters and digits, and a cancel tag. Kept that narrow: tag characters map onto all of
        // printable ASCII, so a looser pattern would let tag-encoded text through.
        allow: /\u{1F3F4}[\u{E0030}-\u{E0039}\u{E0061}-\u{E007A}]{2,6}\u{E007F}/gu,
    },
    {
        kind: 'instruction-override',
        pattern:
            /\b(?:ignore|disregard|forget|override)\b[^.\n]{0,40}?\b(?:previous|prior|above|earlier|system|other|all)\b[^.\n]{0,20}?\b(?:instructions?|prompts?|rules|guidelines)\b|\b(?:do not|don't|never)\s+(?:tell|inform|mention|reveal\s+(?:this\s+)?to)\s+the\s+user\b|\b(?:reveal|print|output|repeat|leak)\b[^.\n]{0,30}?\bsystem prompt\b/gi,
    },
    {
        kind: 'secret',
        pattern:
            /-----BEGIN [A-Z ]*PRIVATE KEY-----|\bAKIA[0-9A-Z]{16}\b|\b(?:ghp|gho|ghs|ghu|github_pat)_[A-Za-z0-9_]{20,}|\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{20,}|\bxox[abprs]-[A-Za-z0-9-]{10,}|\bAIza[0-9A-Za-z_-]{35}\b/g,
    },
    {
        kind: 'risky-command',
        pattern:
            /\b(?:curl|wget)\b[^\n|]*\|\s*(?:sudo\s+)?(?:ba|z)?sh\b|\bbase64\s+(?:-d|--decode)\b[^\n|]*\|\s*(?:ba|z)?sh\b|\brm\s+-[a-z]*r[a-z]*f?\s+(?:\/|~|\$HOME)(?:\s|$)|\b(?:Invoke-Expression|iex)\b\s*\(?\s*(?:\(?\s*New-Object|irm|iwr|Invoke-WebRequest)/gi,
    },
    {
        kind: 'encoded-blob',
        pattern: /(?<![\w+/:,])[A-Za-z0-9+/]{400,}={0,2}/g,
        skip: (path) => path.endsWith('.svg'),
    },
    {
        kind: 'remote-image',
        // A remote image with a query string can send data to a server when the reply is shown.
        pattern: /!\[[^\]]*\]\(\s*<?https?:\/\/[^)\s>]+\?[^)\s>]*=/gi,
    },
];

const LINK_PATTERN = /\bhttps?:\/\/([a-z0-9.-]+\.[a-z]{2,})(?=[/:?#)\]\s>"'`]|$)/gi;

const lineAt = (text: string, index: number) => text.slice(0, index).split('\n').length;

const checkText = (path: string, text: string, findings: SkillCheckFinding[]) => {
    for (const { kind, pattern, allow, skip } of TEXT_PATTERNS) {
        if (skip?.(path)) {
            continue;
        }
        const scanned = allow ? text.replace(allow, '') : text;
        const matches = [...scanned.matchAll(pattern)];
        if (matches.length) {
            findings.push({ kind, path, line: lineAt(scanned, matches[0].index ?? 0), count: matches.length });
        }
    }
};

const collectLinkDomains = (text: string, domains: Set<string>) => {
    for (const [, host] of text.matchAll(LINK_PATTERN)) {
        domains.add(host.toLowerCase().replace(/^www\./, ''));
    }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/** Reports local and plain-HTTP servers; an empty `url` is a placeholder the user fills in, not a risk. */
const checkMcpConfig = (text: string, findings: SkillCheckFinding[]): string[] => {
    let json: unknown;
    try {
        json = JSON.parse(text);
    } catch {
        return [];
    }
    const servers = isRecord(json) && isRecord(json.mcpServers) ? Object.entries(json.mcpServers) : [];
    const local = servers.filter(([, server]) => isRecord(server) && typeof server.command === 'string').length;
    const insecure = servers.filter(
        ([, server]) => isRecord(server) && typeof server.url === 'string' && /^http:\/\//i.test(server.url.trim())
    ).length;
    if (local) {
        findings.push({ kind: 'local-mcp-server', path: MCP_CONFIG_PATH, count: local });
    }
    if (insecure) {
        findings.push({ kind: 'insecure-mcp-server', path: MCP_CONFIG_PATH, count: insecure });
    }
    return servers.map(([name]) => name.slice(0, 64));
};

export const checkSkill = (draft: Pick<SkillDraft, 'instructions' | 'files'>): SkillCheckReport => {
    const findings: SkillCheckFinding[] = [];
    const domains = new Set<string>();
    let connectors: string[] = [];
    checkText(SKILL_MARKDOWN_PATH, draft.instructions, findings);
    collectLinkDomains(draft.instructions, domains);
    const textFiles = draft.files.filter((file) => isTextSkillFile(file.mimeType));
    for (const file of textFiles) {
        const text = decodeText(file.data);
        checkText(file.path, text, findings);
        if (file.path === MCP_CONFIG_PATH) {
            connectors = checkMcpConfig(text, findings);
        } else {
            collectLinkDomains(text, domains);
        }
    }
    return {
        findings,
        checkedFileCount: textFiles.length + (draft.instructions.trim() ? 1 : 0),
        scriptCount: draft.files.filter((file) => isSkillScriptFile(file.path)).length,
        connectors,
        linkDomains: [...domains].sort().slice(0, MAX_LINK_DOMAINS),
    };
};

export const getSkillCheckFindingText = (kind: SkillCheckFindingKind): { title: string; detail: string } => {
    switch (kind) {
        case 'hidden-text':
            return {
                title: c('collider_2025:Info').t`Hidden characters`,
                detail: c('collider_2025:Info')
                    .t`Invisible characters can hide instructions that you can't see but the model can read.`,
            };
        case 'instruction-override':
            return {
                title: c('collider_2025:Info').t`Tries to override instructions`,
                detail: c('collider_2025:Info')
                    .t`Text that tells the model to ignore its rules or keep things from you.`,
            };
        case 'secret':
            return {
                title: c('collider_2025:Info').t`Looks like a password or key`,
                detail: c('collider_2025:Info')
                    .t`Something that looks like an API key or private key. Remove it before sharing the skill.`,
            };
        case 'risky-command':
            return {
                title: c('collider_2025:Info').t`Risky command`,
                detail: c('collider_2025:Info')
                    .t`A command that downloads and runs code or deletes files. Don't run it without reading it first.`,
            };
        case 'encoded-blob':
            return {
                title: c('collider_2025:Info').t`Encoded content`,
                detail: c('collider_2025:Info').t`A long block of encoded data that can't be read as it is.`,
            };
        case 'remote-image':
            return {
                title: c('collider_2025:Info').t`Remote image with parameters`,
                detail: c('collider_2025:Info')
                    .t`An image link that could send information to another server when it loads.`,
            };
        case 'local-mcp-server':
            return {
                title: c('collider_2025:Info').t`Asks to run a local program`,
                detail: c('collider_2025:Info').t`The plugin sets up a connector that runs a program on your computer.`,
            };
        case 'insecure-mcp-server':
            return {
                title: c('collider_2025:Info').t`Unencrypted connector`,
                detail: c('collider_2025:Info').t`The plugin sets up a connector that doesn't use HTTPS.`,
            };
    }
};
