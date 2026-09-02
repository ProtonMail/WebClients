import type { JSONSchema } from '../contracts/types';
import { validateToolArgs } from './validate';

const schema = (properties: Record<string, JSONSchema>, required: string[]): JSONSchema => ({
    type: 'object',
    additionalProperties: false,
    required,
    properties,
});

describe('validateToolArgs', () => {
    it('rejects a non-object arguments value', () => {
        const result = validateToolArgs(schema({}, []), 'not an object');
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toContain('must be a JSON object');
        }
    });

    it('rejects a missing required, non-nullable field', () => {
        const result = validateToolArgs(schema({ handle: { type: 'string' } }, ['handle']), {});
        expect(result).toEqual({ ok: false, error: "ValidationError: missing required field 'handle'" });
    });

    it('materialises an omitted required-but-nullable field as null', () => {
        const result = validateToolArgs(schema({ parentId: { type: ['string', 'null'] } }, ['parentId']), {});
        expect(result).toEqual({ ok: true, value: { parentId: null } });
    });

    it('drops hallucinated extra keys (additionalProperties: false)', () => {
        const result = validateToolArgs(schema({ handle: { type: 'string' } }, ['handle']), {
            handle: 'e1',
            bogus: 'x',
        });
        expect(result).toEqual({ ok: true, value: { handle: 'e1' } });
    });

    it('coerces the mistyped "None"/"null" string to null for a nullable field', () => {
        const s = schema({ parentId: { type: ['string', 'null'] } }, ['parentId']);
        expect(validateToolArgs(s, { parentId: 'None' })).toEqual({ ok: true, value: { parentId: null } });
        expect(validateToolArgs(s, { parentId: 'null' })).toEqual({ ok: true, value: { parentId: null } });
        // A genuine string value is left untouched.
        expect(validateToolArgs(s, { parentId: 'fld3' })).toEqual({ ok: true, value: { parentId: 'fld3' } });
    });

    it('coerces a numeric string to a number only when a number is allowed and a string is not', () => {
        expect(validateToolArgs(schema({ n: { type: 'number' } }, ['n']), { n: '42' })).toEqual({
            ok: true,
            value: { n: 42 },
        });
        // When the field also accepts a string, the numeric string is kept as-is (ambiguous → no guess).
        expect(validateToolArgs(schema({ n: { type: ['string', 'number'] } }, ['n']), { n: '42' })).toEqual({
            ok: true,
            value: { n: '42' },
        });
    });

    it('coerces "true"/"false" to a boolean for a nullable-boolean field', () => {
        const s = schema({ unread: { type: ['boolean', 'null'] } }, ['unread']);
        expect(validateToolArgs(s, { unread: 'true' })).toEqual({ ok: true, value: { unread: true } });
        expect(validateToolArgs(s, { unread: 'False' })).toEqual({ ok: true, value: { unread: false } });
    });

    it('wraps a lone scalar into a single-element array for an array field', () => {
        const s = schema({ ids: { type: 'array', items: { type: 'string' } } }, ['ids']);
        expect(validateToolArgs(s, { ids: 'e1' })).toEqual({ ok: true, value: { ids: ['e1'] } });
    });

    it('validates array item types', () => {
        const s = schema({ ids: { type: 'array', items: { type: 'string' } } }, ['ids']);
        expect(validateToolArgs(s, { ids: ['e1', 'e2'] })).toEqual({ ok: true, value: { ids: ['e1', 'e2'] } });
        const bad = validateToolArgs(s, { ids: ['e1', 5] });
        expect(bad.ok).toBe(false);
        if (!bad.ok) {
            expect(bad.error).toContain("field 'ids[1]'");
        }
    });

    it('rejects a value that matches no allowed type, naming the field and types', () => {
        const result = validateToolArgs(schema({ parentId: { type: ['string', 'null'] } }, ['parentId']), {
            parentId: 5,
        });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toBe("ValidationError: 5 is not of type 'string,null' for field 'parentId'");
        }
    });

    it('enforces an enum', () => {
        const s = schema({ guide: { type: 'string', enum: ['search', 'create_filter'] } }, ['guide']);
        expect(validateToolArgs(s, { guide: 'search' })).toEqual({ ok: true, value: { guide: 'search' } });
        const bad = validateToolArgs(s, { guide: 'nope' });
        expect(bad.ok).toBe(false);
        if (!bad.ok) {
            expect(bad.error).toContain('is not one of');
        }
    });

    it('rejects a string shorter than minLength', () => {
        const s = schema({ description: { type: 'string', minLength: 1 } }, ['description']);
        expect(validateToolArgs(s, { description: 'x' })).toEqual({ ok: true, value: { description: 'x' } });
        const bad = validateToolArgs(s, { description: '' });
        expect(bad.ok).toBe(false);
        if (!bad.ok) {
            expect(bad.error).toContain('shorter than the 1-character minimum');
        }
    });

    it('treats a required, non-nullable field that arrived as null as missing', () => {
        const result = validateToolArgs(schema({ handle: { type: 'string' } }, ['handle']), { handle: null });
        expect(result).toEqual({ ok: false, error: "ValidationError: missing required field 'handle'" });
    });
});
