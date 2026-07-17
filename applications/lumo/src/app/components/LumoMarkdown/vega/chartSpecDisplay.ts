import { sanitizeVegaSpec, VegaSpecParseError, VegaSpecSecurityError } from './sanitizeVegaSpec';

export function prettyJson(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) {
        return trimmed;
    }

    try {
        return JSON.stringify(JSON.parse(trimmed), null, 2);
    } catch {
        return raw;
    }
}

export function getRenderedSpecJson(raw: string): { json: string | null; error: string | null } {
    try {
        const spec = sanitizeVegaSpec(raw);
        return { json: JSON.stringify(spec, null, 2), error: null };
    } catch (error) {
        if (error instanceof VegaSpecParseError || error instanceof VegaSpecSecurityError) {
            return { json: null, error: error.message };
        }

        return {
            json: null,
            error: error instanceof Error ? error.message : 'Failed to sanitize Vega spec',
        };
    }
}
