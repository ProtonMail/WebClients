export const MAX_SKILL_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_SKILL_TOTAL_BYTES = 25 * 1024 * 1024;
export const MAX_SKILL_FILE_COUNT = 200;

const MIME_BY_EXTENSION: Record<string, string> = {
    md: 'text/markdown',
    markdown: 'text/markdown',
    txt: 'text/plain',
    json: 'application/json',
    yaml: 'application/yaml',
    yml: 'application/yaml',
    csv: 'text/csv',
    html: 'text/html',
    css: 'text/css',
    js: 'text/javascript',
    ts: 'text/plain',
    py: 'text/x-python',
    sh: 'text/x-shellscript',
    xml: 'application/xml',
    svg: 'image/svg+xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    pdf: 'application/pdf',
};

/** Native executables have no place in a skill bundle. Scripts are allowed: Claude skills ship them. */
const BLOCKED_EXTENSIONS = new Set([
    'exe',
    'dll',
    'so',
    'dylib',
    'bat',
    'cmd',
    'com',
    'msi',
    'scr',
    'jar',
    'app',
    'dmg',
]);

const getExtension = (path: string) => /\.([^./]+)$/.exec(path)?.[1]?.toLowerCase() ?? '';

export const getSkillFileMimeType = (path: string) =>
    MIME_BY_EXTENSION[getExtension(path)] ?? 'application/octet-stream';

export const isBlockedSkillFile = (path: string) => BLOCKED_EXTENSIONS.has(getExtension(path));

const SCRIPT_EXTENSIONS = new Set(['py', 'sh', 'bash', 'zsh', 'js', 'mjs', 'cjs', 'ts', 'rb', 'pl', 'ps1']);

/** Scripts are stored and readable, but nothing runs them. */
export const isSkillScriptFile = (path: string) => SCRIPT_EXTENSIONS.has(getExtension(path));

export const isTextSkillFile = (mimeType: string) =>
    mimeType.startsWith('text/') ||
    ['application/json', 'application/yaml', 'application/xml', 'image/svg+xml'].includes(mimeType);

/**
 * Normalises a relative path inside a skill bundle, or returns undefined if it is unsafe:
 * absolute, escaping the bundle with `..`, or empty.
 */
export const normalizeSkillFilePath = (rawPath: string): string | undefined => {
    const path = rawPath.replace(/\\/g, '/').trim();
    if (!path || path.startsWith('/') || /^[a-zA-Z]:/.test(path)) {
        return undefined;
    }
    const segments: string[] = [];
    for (const segment of path.split('/')) {
        if (segment === '' || segment === '.') {
            continue;
        }
        if (segment === '..') {
            return undefined;
        }
        segments.push(segment);
    }
    return segments.length ? segments.join('/') : undefined;
};

export const encodeText = (text: string) => new TextEncoder().encode(text) as Uint8Array<ArrayBuffer>;
export const decodeText = (data: Uint8Array<ArrayBuffer>) => new TextDecoder().decode(data);
