export type NamedFile = { id: string; name: string; folderPath?: string };

const MAX_NAME_MATCHES = 5;
export const MAX_MENTIONED_FILES = 10;
/** Names scanned for mentions in one page, so a huge Drive index stays fast. */
const MAX_SCANNED_NAMES = 5_000;
const MIN_NAME_CHARS = 4;

const EXTENSION = /\.[a-z0-9]{1,6}$/i;

const lastSegment = (reference: string) => reference.split(/[\\/]/).filter(Boolean).at(-1) ?? reference;

/** "Q3 Budget_final.xlsx" and "q3-budget final" both become "q3 budget final". */
export function normalizeFileName(name: string): string {
    return lastSegment(name.trim())
        .replace(EXTENSION, '')
        .toLowerCase()
        .replace(/[\s_\-.]+/g, ' ')
        .trim();
}

const normalizeText = (text: string) => ` ${text.toLowerCase().replace(/[\s_\-.,;:()[\]{}"'`*#|<>!?]+/g, ' ')} `;

/**
 * Files a reference such as "Budget 2027.xlsx", "budget_2027" or "Finance/Budget 2027" points to:
 * exact names first, then names equal once normalized, then names containing the reference.
 */
export function findFilesByName(reference: string, files: NamedFile[]): NamedFile[] {
    const wanted = reference.trim().toLowerCase();
    const wantedName = lastSegment(wanted);
    const wantedFolder = wanted.includes('/') ? wanted.slice(0, wanted.length - wantedName.length).replace(/\/+$/, '') : '';
    const wantedNormalized = normalizeFileName(reference);
    if (!wantedNormalized) {
        return [];
    }
    const inFolder = (file: NamedFile) =>
        !wantedFolder || (file.folderPath ?? '').toLowerCase().replace(/\/+$/, '').endsWith(wantedFolder);

    const tiers: ((file: NamedFile) => boolean)[] = [
        (file) => file.name.toLowerCase() === wantedName && inFolder(file),
        (file) => normalizeFileName(file.name) === wantedNormalized && inFolder(file),
        (file) => {
            const normalized = normalizeFileName(file.name);
            return (
                wantedNormalized.length >= MIN_NAME_CHARS &&
                inFolder(file) &&
                (normalized.includes(wantedNormalized) || (normalized.length >= MIN_NAME_CHARS && wantedNormalized.includes(normalized)))
            );
        },
    ];
    for (const matches of tiers) {
        const found = files.filter(matches);
        if (found.length > 0) {
            return found.slice(0, MAX_NAME_MATCHES);
        }
    }
    return [];
}

/**
 * Other known files a passage names, so the model can follow a reference in one step. A name
 * counts when it appears with its extension, or, without it, when it has several words: a
 * one-word name such as "notes" would match ordinary prose.
 */
export function findMentionedFiles(text: string, files: NamedFile[], excludeId: string): NamedFile[] {
    const lowered = text.toLowerCase();
    const normalizedText = normalizeText(text);
    const mentioned: NamedFile[] = [];
    for (const file of files.slice(0, MAX_SCANNED_NAMES)) {
        if (file.id === excludeId || file.name.length < MIN_NAME_CHARS) {
            continue;
        }
        const base = normalizeFileName(file.name);
        const named =
            lowered.includes(file.name.toLowerCase()) ||
            (base.includes(' ') && base.length >= MIN_NAME_CHARS && normalizedText.includes(` ${base} `));
        if (named) {
            mentioned.push(file);
            if (mentioned.length >= MAX_MENTIONED_FILES) {
                break;
            }
        }
    }
    return mentioned;
}
