import type { JSONSchema } from '../contracts/types';

/**
 * Schema-driven validation + coercion middleware for a tool call's arguments.
 *
 * The backend applies NO grammar to client tool-calls on the chat leg (confirmed 2026-07-07): the
 * model's arguments are best-effort, not enforced — we have seen a mistyped `"parentId":"None"`
 * (the string, not JSON `null`) come back. So every tool call passes through here between "the model
 * emitted the call" and "the handler runs". It validates the arguments against that tool's own
 * `paramsSchema` (the SAME schema used to build the descriptor — one source of truth), coerces a few
 * unambiguous mistypings, and otherwise rejects — the engine feeds the rejection back to the model as
 * the tool's result so it self-corrects on the next turn.
 *
 * This deliberately covers only the small, closed schema vocabulary our tools use (object with typed
 * scalar / nullable-scalar / string-array / enum properties, `minLength`, `additionalProperties: false`).
 * It is not a general JSON-Schema validator — keeping it hand-rolled avoids a runtime-codegen dep (ajv),
 * which Proton's CSP blocks, and keeps the engine out of the shared bundle's weight budget.
 */

export type ValidationResult = { ok: true; value: Record<string, any> } | { ok: false; error: string };

const isPlainObject = (value: unknown): value is Record<string, any> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/** The JSON-Schema `type` of a property as a set of allowed type names. */
const allowedTypes = (schema: JSONSchema): string[] => {
    const { type } = schema ?? {};
    if (Array.isArray(type)) {
        return type;
    }
    return typeof type === 'string' ? [type] : [];
};

const allowsNull = (schema: JSONSchema): boolean => allowedTypes(schema).includes('null');

/** Whether a concrete runtime value satisfies a single JSON-Schema type name. */
const matchesType = (value: unknown, typeName: string): boolean => {
    switch (typeName) {
        case 'string':
            return typeof value === 'string';
        case 'number':
            return typeof value === 'number' && Number.isFinite(value);
        case 'integer':
            return typeof value === 'number' && Number.isInteger(value);
        case 'boolean':
            return typeof value === 'boolean';
        case 'null':
            return value === null;
        case 'array':
            return Array.isArray(value);
        case 'object':
            return isPlainObject(value);
        default:
            return false;
    }
};

/** Human-readable rendering of a schema's allowed types, for error messages (e.g. `string,null`). */
const describeTypes = (schema: JSONSchema): string => allowedTypes(schema).join(',') || 'unknown';

/**
 * Coerce a single best-effort value toward what the property schema allows — ONLY unambiguous cases:
 *  - the observed `"None"`/`"null"` string (any case) → `null`, when the field is nullable;
 *  - a numeric string (`"42"`) → number, when a number/integer is allowed and a string is not;
 *  - `"true"`/`"false"` (any case) → boolean, when a boolean is allowed and a string is not;
 *  - a lone scalar where an array is required → a single-element array (the model dropped the `[ ]`).
 * Anything else is returned unchanged for the validator to accept or reject — never guessed at.
 */
const coerce = (value: unknown, schema: JSONSchema): unknown => {
    const types = allowedTypes(schema);
    const permits = (name: string) => types.includes(name);

    if (typeof value === 'string') {
        const lowered = value.trim().toLowerCase();
        if (permits('null') && (lowered === 'none' || lowered === 'null')) {
            return null;
        }
        if (
            !permits('string') &&
            (permits('number') || permits('integer')) &&
            value.trim() !== '' &&
            Number.isFinite(Number(value))
        ) {
            return Number(value);
        }
        if (!permits('string') && permits('boolean') && (lowered === 'true' || lowered === 'false')) {
            return lowered === 'true';
        }
    }

    // A scalar handed to an array field: wrap it. Coerce the wrapped item against the array's `items`.
    if (permits('array') && !Array.isArray(value) && value !== null && value !== undefined) {
        const items = (schema.items ?? {}) as JSONSchema;
        return [coerce(value, items)];
    }

    if (Array.isArray(value) && permits('array')) {
        const items = (schema.items ?? {}) as JSONSchema;
        return value.map((entry) => coerce(entry, items));
    }

    return value;
};

/** Validate a coerced value against a property schema; returns an error clause or null when valid. */
const validateValue = (value: unknown, schema: JSONSchema, field: string): string | null => {
    const types = allowedTypes(schema);

    if (types.length && !types.some((typeName) => matchesType(value, typeName))) {
        return `${JSON.stringify(value)} is not of type '${describeTypes(schema)}' for field '${field}'`;
    }

    // `enum` (with null tolerated when the schema is nullable).
    if (Array.isArray(schema.enum) && !(value === null && allowsNull(schema)) && !schema.enum.includes(value as any)) {
        return `${JSON.stringify(value)} is not one of ${JSON.stringify(schema.enum)} for field '${field}'`;
    }

    if (typeof value === 'string' && typeof schema.minLength === 'number' && value.length < schema.minLength) {
        return `${JSON.stringify(value)} is shorter than the ${schema.minLength}-character minimum for field '${field}'`;
    }

    // Array items.
    if (Array.isArray(value) && schema.items) {
        const items = schema.items as JSONSchema;
        for (let index = 0; index < value.length; index++) {
            const itemError = validateValue(value[index], items, `${field}[${index}]`);
            if (itemError) {
                return itemError;
            }
        }
    }

    return null;
};

/**
 * Validate + coerce a tool call's raw arguments against its `paramsSchema`.
 *
 * On success, `value` contains ONLY the schema's declared properties (any hallucinated extra keys are
 * dropped — `additionalProperties: false`), coerced, with every `required` property present: a
 * nullable required field that was omitted is materialised as `null` (so handlers always receive the
 * key), a non-nullable required field that is missing/null is a rejection.
 */
export const validateToolArgs = (schema: JSONSchema, rawArgs: unknown): ValidationResult => {
    if (!isPlainObject(rawArgs)) {
        return { ok: false, error: `ValidationError: arguments must be a JSON object, got ${JSON.stringify(rawArgs)}` };
    }

    const properties: Record<string, JSONSchema> = schema.properties ?? {};
    const required: string[] = schema.required ?? [];
    const value: Record<string, any> = {};

    for (const [field, propSchema] of Object.entries(properties)) {
        const isRequired = required.includes(field);
        const present = Object.prototype.hasOwnProperty.call(rawArgs, field) && rawArgs[field] !== undefined;

        if (!present) {
            // Absent: a nullable required field becomes explicit null; a non-nullable required field is
            // a hard miss; an optional field is simply left out.
            if (isRequired && !allowsNull(propSchema)) {
                return { ok: false, error: `ValidationError: missing required field '${field}'` };
            }
            if (isRequired && allowsNull(propSchema)) {
                value[field] = null;
            }
            continue;
        }

        const coerced = coerce(rawArgs[field], propSchema);

        // A required, non-nullable field that coerced/arrived as null is still a miss.
        if (isRequired && !allowsNull(propSchema) && coerced === null) {
            return { ok: false, error: `ValidationError: missing required field '${field}'` };
        }

        const error = validateValue(coerced, propSchema, field);
        if (error) {
            return { ok: false, error: `ValidationError: ${error}` };
        }

        value[field] = coerced;
    }

    return { ok: true, value };
};
