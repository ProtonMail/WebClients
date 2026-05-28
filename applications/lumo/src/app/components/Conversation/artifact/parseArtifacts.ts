export interface ParsedArtifact {
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

export function parseArtifacts(raw: string): ParseResult {
    const artifacts: ParsedArtifact[] = [];

    try {
        const ARTIFACT_RE = /<artifact\s+([^>]*?)>([\s\S]*?)<\/artifact>/g;
        let prose = raw;
        let match;

        while ((match = ARTIFACT_RE.exec(raw)) !== null) {
            const [fullMatch, attrString, content] = match;
            const attrs = parseAttributes(attrString ?? '');

            const type = attrs.type;
            if (!type || (type !== 'code' && type !== 'document')) {
                return { prose: raw, artifacts: [] };
            }

            if (!attrs.title) {
                return { prose: raw, artifacts: [] };
            }

            artifacts.push({
                type: type as 'code' | 'document',
                language: type === 'code' ? (attrs.language ?? 'text') : undefined,
                title: attrs.title,
                content: content?.trim() ?? '',
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
        const COMPLETE_RE = /<artifact\s+([^>]*?)>([\s\S]*?)<\/artifact>/g;
        let match;
        while ((match = COMPLETE_RE.exec(raw)) !== null) {
            const [fullMatch, attrString, content] = match;
            const attrs = parseAttributes(attrString ?? '');
            if ((attrs.type === 'code' || attrs.type === 'document') && attrs.title) {
                completeArtifacts.push({
                    type: attrs.type,
                    language: attrs.type === 'code' ? (attrs.language ?? 'text') : undefined,
                    title: attrs.title,
                    content: content?.trim() ?? '',
                });
            }
            prose = prose.replace(fullMatch!, '');
        }

        // State 2: full opening tag present, content streaming, no closing tag yet
        const INCOMPLETE_OPEN_RE = /<artifact\s+([^>]*?)>([\s\S]*)$/;
        const incompleteMatch = INCOMPLETE_OPEN_RE.exec(prose);
        if (incompleteMatch) {
            const attrs = parseAttributes(incompleteMatch[1] ?? '');
            const streamingArtifact: StreamingArtifact = {
                title: attrs.title || undefined,
                type: attrs.type === 'code' || attrs.type === 'document' ? attrs.type : undefined,
                language: attrs.language || undefined,
                content: incompleteMatch[2] ?? '',
                isComplete: false,
            };
            prose = prose.substring(0, incompleteMatch.index).trim();
            return { prose, completeArtifacts, streamingArtifact };
        }

        // State 1: partial opening tag, `>` not yet received
        const PARTIAL_TAG_RE = /<artifact[^>]*$/;
        const partialMatch = PARTIAL_TAG_RE.exec(prose);
        if (partialMatch) {
            prose = prose.substring(0, partialMatch.index).trim();
            return { prose, completeArtifacts, streamingArtifact: { content: '', isComplete: false } };
        }

        return { prose: prose.trim(), completeArtifacts, streamingArtifact: null };
    } catch {
        return { prose: raw, completeArtifacts: [], streamingArtifact: null };
    }
}

/**
 * Strips complete `<artifact>…</artifact>` blocks from a completed message's text block.
 */
export function stripArtifactTags(content: string): string {
    return content.replace(/<artifact\s+[^>]*?>[\s\S]*?<\/artifact>/g, '').trim();
}

/**
 * Strips artifact markup from a streaming text block: removes both complete artifact
 * tags and any in-progress artifact content starting from `<artifact` to end of string.
 */
export function stripArtifactContent(content: string): string {
    // First remove any complete artifact blocks
    let result = content.replace(/<artifact\s+[^>]*?>[\s\S]*?<\/artifact>/g, '');
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
