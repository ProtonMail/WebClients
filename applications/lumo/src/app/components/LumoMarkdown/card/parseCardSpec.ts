import { CARD_TYPES, type LumoCardDirection, type LumoCardSeverity, type LumoCardSpec, type LumoCardType } from './cardTypes';

export class CardSpecParseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CardSpecParseError';
    }
}

const CARD_DIRECTIONS = new Set<LumoCardDirection>(['up', 'down', 'flat']);
const CARD_SEVERITIES = new Set<LumoCardSeverity>(['info', 'warning', 'critical']);

function parseJsonLenient(raw: string): unknown {
    try {
        return JSON.parse(raw);
    } catch {
        const withoutTrailingCommas = raw.replace(/,\s*([}\]])/g, '$1');
        return JSON.parse(withoutTrailingCommas);
    }
}

function readString(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim()) {
        throw new CardSpecParseError(`Card ${field} must be a non-empty string`);
    }

    return value.trim();
}

function readOptionalString(value: unknown): string | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }

    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim();
    return trimmed || undefined;
}

function readType(value: unknown): LumoCardType {
    if (typeof value !== 'string' || !CARD_TYPES.includes(value as LumoCardType)) {
        throw new CardSpecParseError(`Card type must be one of: ${CARD_TYPES.join(', ')}`);
    }

    return value as LumoCardType;
}

function readDirection(value: unknown): LumoCardDirection | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }

    if (typeof value !== 'string' || !CARD_DIRECTIONS.has(value as LumoCardDirection)) {
        throw new CardSpecParseError('Card direction must be up, down, or flat');
    }

    return value as LumoCardDirection;
}

function readSeverity(value: unknown): LumoCardSeverity | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }

    if (typeof value !== 'string' || !CARD_SEVERITIES.has(value as LumoCardSeverity)) {
        throw new CardSpecParseError('Card severity must be info, warning, or critical');
    }

    return value as LumoCardSeverity;
}

function readTags(value: unknown): string[] | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }

    if (!Array.isArray(value)) {
        throw new CardSpecParseError('Card tags must be an array of strings');
    }

    const tags = value
        .filter((tag): tag is string => typeof tag === 'string')
        .map((tag) => tag.trim())
        .filter(Boolean);

    return tags.length > 0 ? tags : undefined;
}

export function parseCardSpec(raw: string): LumoCardSpec {
    const trimmed = raw.trim();
    if (!trimmed) {
        throw new CardSpecParseError('Card spec is empty');
    }

    let parsed: unknown;
    try {
        parsed = parseJsonLenient(trimmed);
    } catch {
        throw new CardSpecParseError('Card spec is not valid JSON');
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new CardSpecParseError('Card spec must be a JSON object');
    }

    const objectValue = parsed as Record<string, unknown>;
    const type = readType(objectValue.type);
    const title =
        type === 'summary' ? (readOptionalString(objectValue.title) ?? '') : readString(objectValue.title, 'title');

    const spec: LumoCardSpec = {
        type,
        title,
        value: readOptionalString(objectValue.value),
        delta: readOptionalString(objectValue.delta),
        direction: readDirection(objectValue.direction),
        body: readOptionalString(objectValue.body),
        tags: readTags(objectValue.tags),
        severity: readSeverity(objectValue.severity),
    };

    if (type === 'metric' && !spec.value) {
        throw new CardSpecParseError('Metric cards require a value');
    }

    if ((type === 'finding' || type === 'summary') && !spec.body) {
        throw new CardSpecParseError(`${type} cards require a body`);
    }

    return spec;
}

/** Best-effort parse for grouping logic — returns null when JSON is incomplete or invalid. */
export function tryParseCardSpec(raw: string): LumoCardSpec | null {
    try {
        return parseCardSpec(raw);
    } catch {
        return null;
    }
}
