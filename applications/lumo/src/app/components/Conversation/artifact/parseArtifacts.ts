export interface ParsedArtifact {
    id: string;
    type: 'code' | 'document';
    language?: string;
    title: string;
    content: string;
}

export interface ParseResult {
    prose: string;
    artifacts: ParsedArtifact[];
}

// Represents an artifact whose <artifact ...> open tag has been seen but </artifact> has not yet arrived.
export interface StreamingArtifact {
    id?: string;
    // May be undefined if we've only seen a partial opening tag (no `>` yet)
    title?: string;
    type?: 'code' | 'document';
    language?: string;
    // Partial content received so far (empty until the opening `>` has been received)
    content: string;
    isComplete: false;
}

export interface StreamingParseResult {
    prose: string;
    completeArtifacts: ParsedArtifact[];
    // At most one in-progress artifact at a time (the LLM streams sequentially)
    streamingArtifact: StreamingArtifact | null;
}

function parseAttributes(attrString: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const regex = /(\w+)="([^"]*?)"/g;
    let match;
    while ((match = regex.exec(attrString)) !== null) {
        attrs[match[1]!] = match[2]!;
    }
    return attrs;
}

// Matches only well-formed `key="value"` attribute pairs, so a literal `>` inside a quoted
// value (e.g. title="if x > y") can't be mistaken for the tag's closing `>` and truncate the match.
const ARTIFACT_ATTRS = '(?:[a-zA-Z_][a-zA-Z0-9_-]*="[^"]*"\\s*)*';

type OpenTagScan = { start: number; attrsEnd: number; contentStart: number } | 'partial' | null;

// Finds the last still-open `<artifact ...>` tag in `text` by scanning character-by-character
// and tracking quote state, instead of relying on a regex to guess where the tag's closing `>`
// is. A regex-only approach (matching either "attrs are fully closed" or "no `>` seen yet") has
// a gap: while an attribute value is mid-stream and itself contains a literal `>` (e.g.
// `title="if x >`, quote not yet closed), neither pattern matches and the tag is wrongly
// reported as absent. Tracking quote state directly has no such gap — a `>` only ever closes
// the tag when we're not inside a quoted value.
function scanOpenArtifactTag(text: string): OpenTagScan {
    const start = text.lastIndexOf('<artifact');
    if (start === -1) {
        return null;
    }

    const afterKeyword = start + '<artifact'.length;
    const charAfterKeyword = text[afterKeyword];
    if (charAfterKeyword !== undefined && !/\s/.test(charAfterKeyword)) {
        // Not a real `<artifact ...>` tag start (e.g. `<artifactory>`).
        return null;
    }
    if (charAfterKeyword === undefined) {
        // Keyword just arrived, whitespace/attrs not typed yet — still opening.
        return 'partial';
    }

    let inQuotes = false;
    for (let i = afterKeyword; i < text.length; i++) {
        const ch = text[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === '>' && !inQuotes) {
            return { start, attrsEnd: i, contentStart: i + 1 };
        }
    }

    // Reached end of text without an unquoted `>` — tag is still opening (attrs mid-stream).
    return 'partial';
}

// Stable, deterministic fallback id for artifact tags emitted without an `id` attribute
// (legacy conversations, or a model response that omitted it) — djb2 string hash.
export function hashArtifactIdentity(type: string, title: string, content: string): string {
    const input = `${type}:${title}:${content}`;
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
        hash = (hash * 33) ^ input.charCodeAt(i);
    }
    return `legacy-${(hash >>> 0).toString(36)}`;
}

export function parseArtifacts(raw: string): ParseResult {
    const artifacts: ParsedArtifact[] = [];

    try {
        const ARTIFACT_RE = new RegExp(`<artifact\\s+(${ARTIFACT_ATTRS})>([\\s\\S]*?)<\\/artifact>`, 'g');
        let prose = raw;
        let match;

        while ((match = ARTIFACT_RE.exec(raw)) !== null) {
            const [fullMatch, attrString, content] = match;
            const attrs = parseAttributes(attrString ?? '');

            const type = attrs.type;
            if (!type || (type !== 'code' && type !== 'document') || !attrs.title) {
                // Skip only this malformed tag — leave it in the prose rather than dropping every
                // other (potentially valid) artifact in the same message.
                continue;
            }

            const trimmedContent = content?.trim() ?? '';
            artifacts.push({
                id: attrs.id || hashArtifactIdentity(type, attrs.title, trimmedContent),
                type: type as 'code' | 'document',
                language: type === 'code' ? (attrs.language ?? 'text') : undefined,
                title: attrs.title,
                content: trimmedContent,
            });

            prose = prose.replace(fullMatch!, '');
        }

        return { prose: prose.trim(), artifacts };
    } catch {
        return { prose: raw, artifacts: [] };
    }
}

/**
 * Streaming-aware parser. Handles three states:
 *   1. Partial opening tag  — `<artifact` seen, no `>` yet
 *   2. Open tag + content  — `<artifact ...>` seen, `</artifact>` not yet
 *   3. Complete artifact   — both open and close tags present
 *
 * Returns:
 *   - `completeArtifacts`: fully parsed artifacts (state 3)
 *   - `streamingArtifact`: in-progress artifact (state 1 or 2), or null
 *   - `prose`: message text with all artifact markup removed
 */
export function parseStreamingContent(raw: string): StreamingParseResult {
    const completeArtifacts: ParsedArtifact[] = [];
    let prose = raw;

    try {
        // Extract all complete artifacts
        const COMPLETE_RE = new RegExp(`<artifact\\s+(${ARTIFACT_ATTRS})>([\\s\\S]*?)<\\/artifact>`, 'g');
        let match;
        while ((match = COMPLETE_RE.exec(raw)) !== null) {
            const [fullMatch, attrString, content] = match;
            const attrs = parseAttributes(attrString ?? '');
            if ((attrs.type === 'code' || attrs.type === 'document') && attrs.title) {
                const trimmedContent = content?.trim() ?? '';
                completeArtifacts.push({
                    id: attrs.id || hashArtifactIdentity(attrs.type, attrs.title, trimmedContent),
                    type: attrs.type,
                    language: attrs.type === 'code' ? (attrs.language ?? 'text') : undefined,
                    title: attrs.title,
                    content: trimmedContent,
                });
            }
            // Skip only this malformed tag — leave it in the prose rather than dropping every
            // other (potentially valid) artifact in the same message.
            prose = prose.replace(fullMatch!, '');
        }

        // States 1 & 2: an `<artifact` tag is still open (attrs mid-stream, or attrs closed but
        // content/closing-tag not yet arrived). scanOpenArtifactTag is quote-aware so it can't be
        // thrown off by a literal `>` inside an in-progress attribute value.
        const scan = scanOpenArtifactTag(prose);
        if (scan === null) {
            return { prose: prose.trim(), completeArtifacts, streamingArtifact: null };
        }

        if (scan === 'partial') {
            // Attrs are still streaming and haven't reached a closing `>` yet. Salvage whatever
            // fully-formed key="value" pairs have already arrived (e.g. `id`, `type`) so the
            // panel header can show partial info even before `title`'s closing quote lands.
            const tagStart = prose.lastIndexOf('<artifact');
            const partialAttrsRaw = prose.slice(tagStart + '<artifact'.length);
            const attrs = parseAttributes(partialAttrsRaw);
            prose = prose.substring(0, tagStart).trim();
            return {
                prose,
                completeArtifacts,
                streamingArtifact: {
                    id: attrs.id || undefined,
                    title: attrs.title || undefined,
                    type: attrs.type === 'code' || attrs.type === 'document' ? attrs.type : undefined,
                    language: attrs.language || undefined,
                    content: '',
                    isComplete: false,
                },
            };
        }

        const attrsRaw = prose.slice(scan.start + '<artifact'.length, scan.attrsEnd);
        const attrs = parseAttributes(attrsRaw);
        const content = prose.slice(scan.contentStart);
        prose = prose.substring(0, scan.start).trim();
        return {
            prose,
            completeArtifacts,
            streamingArtifact: {
                id: attrs.id || undefined,
                title: attrs.title || undefined,
                type: attrs.type === 'code' || attrs.type === 'document' ? attrs.type : undefined,
                language: attrs.language || undefined,
                content,
                isComplete: false,
            },
        };
    } catch {
        return { prose: raw, completeArtifacts: [], streamingArtifact: null };
    }
}

/**
 * Strips complete `<artifact>…</artifact>` blocks from a completed message's text block.
 */
export function stripArtifactTags(content: string): string {
    return content.replace(new RegExp(`<artifact\\s+${ARTIFACT_ATTRS}>[\\s\\S]*?<\\/artifact>`, 'g'), '').trim();
}

/**
 * Strips artifact markup from a streaming text block: removes both complete artifact
 * tags and any in-progress artifact content starting from `<artifact` to end of string.
 */
export function stripArtifactContent(content: string): string {
    // First remove any complete artifact blocks
    let result = content.replace(new RegExp(`<artifact\\s+${ARTIFACT_ATTRS}>[\\s\\S]*?<\\/artifact>`, 'g'), '');
    // Then strip everything from any remaining `<artifact` to end (in-progress)
    result = result.replace(/<artifact[\s\S]*$/, '');
    return result.trim();
}

const LANGUAGE_EXTENSIONS: Record<string, string> = {
    python: 'py',
    javascript: 'js',
    typescript: 'ts',
    jsx: 'jsx',
    tsx: 'tsx',
    bash: 'sh',
    shell: 'sh',
    sh: 'sh',
    sql: 'sql',
    json: 'json',
    html: 'html',
    css: 'css',
    scss: 'scss',
    rust: 'rs',
    go: 'go',
    java: 'java',
    kotlin: 'kt',
    swift: 'swift',
    cpp: 'cpp',
    c: 'c',
    csharp: 'cs',
    ruby: 'rb',
    php: 'php',
    yaml: 'yaml',
    yml: 'yml',
    toml: 'toml',
    xml: 'xml',
    markdown: 'md',
    md: 'md',
    r: 'r',
    scala: 'scala',
    haskell: 'hs',
    lua: 'lua',
    perl: 'pl',
};

export function getFileExtension(language: string): string {
    return LANGUAGE_EXTENSIONS[language.toLowerCase()] ?? 'txt';
}
