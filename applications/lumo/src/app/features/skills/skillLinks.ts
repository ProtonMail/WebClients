export type SkillLinkTarget =
    | { kind: 'file'; path: string }
    | { kind: 'external'; url: string }
    | { kind: 'anchor' }
    | { kind: 'missing'; path: string }
    | { kind: 'blocked' };

const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;
const SAFE_EXTERNAL_PATTERN = /^(https?:|mailto:)/i;
const FOLDER_ENTRY_FILES = ['SKILL.md', 'README.md'];

const dirname = (path: string) => path.split('/').slice(0, -1);

/** Resolves `./`, `../` and empty segments; `undefined` when the path climbs out of the bundle. */
const normalize = (segments: string[]): string | undefined => {
    const resolved: string[] = [];
    for (const segment of segments) {
        if (segment === '' || segment === '.') {
            continue;
        }
        if (segment === '..') {
            if (!resolved.length) {
                return undefined;
            }
            resolved.pop();
            continue;
        }
        resolved.push(segment);
    }
    return resolved.join('/');
};

const decode = (value: string) => {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
};

/**
 * Where a link in a skill's markdown file points. Relative links resolve against the linking file's
 * folder and leading `/` against the bundle root, as on GitHub. A link to a folder opens its
 * SKILL.md or README.md, or failing that its first file.
 */
export const resolveSkillLink = (fromPath: string, href: string, paths: string[]): SkillLinkTarget => {
    const trimmed = href.trim();
    if (!trimmed || trimmed.startsWith('#')) {
        return { kind: 'anchor' };
    }
    if (SCHEME_PATTERN.test(trimmed) || trimmed.startsWith('//')) {
        return SAFE_EXTERNAL_PATTERN.test(trimmed) ? { kind: 'external', url: trimmed } : { kind: 'blocked' };
    }

    const target = decode(trimmed.split(/[?#]/)[0]);
    const base = target.startsWith('/') ? [] : dirname(fromPath);
    const path = normalize([...base, ...target.split('/')]);
    if (path === undefined) {
        return { kind: 'blocked' };
    }
    if (paths.includes(path)) {
        return { kind: 'file', path };
    }

    const prefix = path ? `${path}/` : '';
    const inFolder = paths.filter((candidate) => candidate.startsWith(prefix));
    const entry =
        FOLDER_ENTRY_FILES.map((name) => `${prefix}${name}`).find((candidate) => inFolder.includes(candidate)) ??
        inFolder[0];
    return entry ? { kind: 'file', path: entry } : { kind: 'missing', path };
};
