export const SKILL_NAME_MAX_LENGTH = 64;
export const SKILL_DESCRIPTION_MAX_LENGTH = 1024;

export type ParsedSkillMarkdown = {
    frontmatter: Record<string, string>;
    body: string;
};

const FRONTMATTER_PATTERN = /^\uFEFF?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

const unquote = (value: string): string => {
    const trimmed = value.trim();
    if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
        try {
            return JSON.parse(trimmed);
        } catch {
            return trimmed.slice(1, -1);
        }
    }
    if (trimmed.length >= 2 && trimmed.startsWith("'") && trimmed.endsWith("'")) {
        return trimmed.slice(1, -1).replace(/''/g, "'");
    }
    return trimmed;
};

/**
 * Parses the flat `key: value` frontmatter used by skills: plain, quoted and block (`|`, `>`)
 * scalars. Nested maps and lists are kept as their raw text, since skills only need scalars.
 */
const parseFrontmatter = (yaml: string): Record<string, string> => {
    const result: Record<string, string> = {};
    const lines = yaml.split(/\r?\n/);
    let i = 0;
    while (i < lines.length) {
        const match = /^([A-Za-z0-9_-]+):(.*)$/.exec(lines[i]);
        i++;
        if (!match) {
            continue;
        }
        const [, key, rawValue] = match;
        const value = rawValue.trim();
        const blockStyle = /^([|>])[+-]?$/.exec(value)?.[1];
        if (blockStyle || value === '') {
            const block: string[] = [];
            while (i < lines.length && (/^\s+\S/.test(lines[i]) || lines[i].trim() === '')) {
                block.push(lines[i]);
                i++;
            }
            const indent = Math.min(
                ...block.filter((line) => line.trim()).map((line) => /^\s*/.exec(line)?.[0].length ?? 0)
            );
            const dedented = block.map((line) => line.slice(Number.isFinite(indent) ? indent : 0));
            result[key] = (blockStyle === '|' ? dedented.join('\n') : dedented.join(' ').replace(/\s+/g, ' ')).trim();
        } else {
            result[key] = unquote(value);
        }
    }
    return result;
};

export const parseSkillMarkdown = (markdown: string): ParsedSkillMarkdown => {
    const match = FRONTMATTER_PATTERN.exec(markdown);
    if (!match) {
        return { frontmatter: {}, body: markdown.trim() };
    }
    return { frontmatter: parseFrontmatter(match[1]), body: markdown.slice(match[0].length).trim() };
};

const toYamlScalar = (value: string): string => {
    if (value === '' || /[:#\n"'{}[\],&*!|>%@`]/.test(value) || value.trim() !== value) {
        return JSON.stringify(value);
    }
    return value;
};

export const buildSkillMarkdown = ({
    name,
    description,
    instructions,
    metadata = {},
}: {
    name: string;
    description: string;
    instructions: string;
    metadata?: Record<string, string>;
}): string => {
    const entries: [string, string][] = [['name', name], ['description', description], ...Object.entries(metadata)];
    const frontmatter = entries.map(([key, value]) => `${key}: ${toYamlScalar(value)}`).join('\n');
    return `---\n${frontmatter}\n---\n\n${instructions.trim()}\n`;
};

/** Lowercases and drops accents from Latin letters only, so `Café` matches `cafe` but other scripts keep their marks. */
export const foldSkillHandleText = (text: string): string =>
    text
        .normalize('NFKD')
        .replace(/(\p{Script=Latin})[\u0300-\u036f]+/gu, '$1')
        .normalize('NFC')
        .toLowerCase();

/**
 * The `/skill-name` handle shown in lists, following the Claude convention of lowercase-hyphenated
 * names. Letters of any script are kept, so names like `日本語の要約` stay invocable.
 */
export const getSkillHandle = (name: string): string =>
    Array.from(
        foldSkillHandleText(name.trim())
            .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
            .replace(/^-+|-+$/g, '')
    )
        .slice(0, SKILL_NAME_MAX_LENGTH)
        .join('')
        .replace(/-+$/, '');
