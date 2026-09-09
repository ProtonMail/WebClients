export const ARTIFACT_TYPES = ['code', 'document', 'webpage', 'presentation'] as const;

export type ArtifactType = (typeof ARTIFACT_TYPES)[number];

export function isArtifactType(value: unknown): value is ArtifactType {
    return typeof value === 'string' && (ARTIFACT_TYPES as readonly string[]).includes(value);
}

export interface ParsedArtifact {
    id: string;
    type: ArtifactType;
    language?: string;
    title: string;
    content: string;
}

/** Deterministic fallback id when the model omits `id` on a create_artifact tool call — djb2 string hash. */
export function hashArtifactIdentity(type: string, title: string, content: string): string {
    const input = `${type}:${title}:${content}`;
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
        hash = (hash * 33) ^ input.charCodeAt(i);
    }
    return `legacy-${(hash >>> 0).toString(36)}`;
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
