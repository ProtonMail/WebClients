/**
 * Best-effort streaming parser for a flat JSON object whose values are all strings — e.g. a client
 * tool call's `arguments` blob while it's still arriving as a growing raw string (before it becomes
 * valid, `JSON.parse`-able JSON). Tracks quote/escape state character-by-character across the whole
 * accumulated text on each call, the same technique used for the `<artifact>` tag scanner, but for a
 * grammar (JSON string escaping) that's actually well-defined instead of free text.
 *
 * Not a general JSON parser: values are assumed to be strings (matches the create-artifact tool's
 * schema), and non-string tokens (numbers, booleans, null, nested objects/arrays) are not extracted.
 */
export interface PartialFlatJsonObject {
    /** Keys whose value's closing quote has already arrived. */
    fields: Record<string, string>;
    /** The field currently mid-stream (opening quote seen, closing quote not yet arrived), if any. */
    partial?: { key: string; value: string };
}

type State = 'beforeKey' | 'inKey' | 'afterKey' | 'beforeValue' | 'inValue' | 'afterValue' | 'done';

export function parsePartialFlatJsonStringObject(raw: string): PartialFlatJsonObject {
    const fields: Record<string, string> = {};

    const objectStart = raw.indexOf('{');
    if (objectStart === -1) {
        return { fields };
    }

    let state: State = 'beforeKey';
    let currentKey = '';
    let currentValue = '';
    let escaping = false;
    let unicodeDigits: string | null = null;

    for (let i = objectStart + 1; i < raw.length && state !== 'done'; i++) {
        const ch = raw[i]!;

        if (state === 'beforeKey') {
            if (ch === '"') {
                state = 'inKey';
                currentKey = '';
            } else if (ch === '}') {
                state = 'done';
            }
            continue;
        }

        if (state === 'inKey') {
            if (ch === '\\') {
                escaping = true;
            } else if (escaping) {
                currentKey += ch;
                escaping = false;
            } else if (ch === '"') {
                state = 'afterKey';
            } else {
                currentKey += ch;
            }
            continue;
        }

        if (state === 'afterKey') {
            if (ch === ':') {
                state = 'beforeValue';
            }
            continue;
        }

        if (state === 'beforeValue') {
            if (ch === '"') {
                state = 'inValue';
                currentValue = '';
            } else if (ch === ',') {
                state = 'beforeKey';
            } else if (ch === '}') {
                state = 'done';
            }
            // Non-string value tokens (numbers/booleans/null) aren't extracted; skip characters until
            // the next `,`/`}` is reached in a later iteration via these same branches.
            continue;
        }

        if (state === 'inValue') {
            if (unicodeDigits !== null) {
                unicodeDigits += ch;
                if (unicodeDigits.length === 4) {
                    const code = Number.parseInt(unicodeDigits, 16);
                    if (!Number.isNaN(code)) {
                        currentValue += String.fromCharCode(code);
                    }
                    unicodeDigits = null;
                }
                continue;
            }
            if (escaping) {
                switch (ch) {
                    case 'n':
                        currentValue += '\n';
                        break;
                    case 't':
                        currentValue += '\t';
                        break;
                    case 'r':
                        currentValue += '\r';
                        break;
                    case 'b':
                        currentValue += '\b';
                        break;
                    case 'f':
                        currentValue += '\f';
                        break;
                    case 'u':
                        unicodeDigits = '';
                        break;
                    default:
                        // Covers `"`, `\`, `/`, and any other escaped char — JSON only needs the literal.
                        currentValue += ch;
                }
                escaping = false;
                continue;
            }
            if (ch === '\\') {
                escaping = true;
            } else if (ch === '"') {
                fields[currentKey] = currentValue;
                state = 'afterValue';
            } else {
                currentValue += ch;
            }
            continue;
        }

        if (state === 'afterValue') {
            if (ch === ',') {
                state = 'beforeKey';
            } else if (ch === '}') {
                state = 'done';
            }
        }
    }

    if (state === 'inValue') {
        // Mid-escape sequences are deliberately excluded from `currentValue` above (nothing is appended
        // until an escape resolves), so a trailing incomplete `\` or `\uXX` is never included here.
        return { fields, partial: { key: currentKey, value: currentValue } };
    }

    return { fields };
}
