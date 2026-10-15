/**
 * Repairs the JSON slips models make in long decks, seen in the model eval (2026-10-15): a missing
 * comma between two values, closing brackets left over at the end, brackets left open, and a stray
 * `{` in front of a list of strings (`["a", {"b", "c"]`). It walks the text once, keeping track of
 * strings and open brackets, and only ever inserts a comma, drops a bracket that doesn't fit, or
 * closes what's left open. Anything it can't make valid returns null; the caller reports every repair.
 */

const CLOSER: Record<string, string> = { '{': '}', '[': ']' };

interface OpenBracket {
    character: '{' | '[';
    /** Where the bracket sits in the output, so a stray `{` can be taken out again. */
    outputIndex: number;
    /** Objects: the next string is a key. */
    expectKey: boolean;
    /** Objects: no key seen yet. */
    empty: boolean;
}

/** Characters that can start a JSON value. */
const startsValue = (character: string): boolean => {
    return /["{[\-0-9tfn]/.test(character);
};

const nextNonSpace = (text: string, from: number): string | undefined => {
    return text.slice(from).match(/\S/)?.[0];
};

export const repairJson = (text: string): string | null => {
    let output = '';
    const stack: OpenBracket[] = [];
    // True right after a complete value, where only a comma, a colon or a closer may follow.
    let afterValue = false;
    let index = 0;

    while (index < text.length) {
        const character = text[index]!;
        const top = stack[stack.length - 1];

        if (/\s/.test(character)) {
            output += character;
            index++;
            continue;
        }

        if (afterValue && startsValue(character) && top) {
            // Two values in a row inside an array or object: the comma is missing.
            output += ',';
            afterValue = false;
            if (top.character === '{') {
                top.expectKey = true;
            }
        }

        if (character === '"') {
            let end = index + 1;
            while (end < text.length && text[end] !== '"') {
                end += text[end] === '\\' ? 2 : 1;
            }
            const isKeyPosition = top?.character === '{' && top.expectKey;
            if (isKeyPosition && nextNonSpace(text, end + 1) !== ':') {
                if (!top.empty) {
                    return null;
                }
                // A `{` opened in front of plain strings: drop it, and read the string as a value.
                output = output.slice(0, top.outputIndex) + output.slice(top.outputIndex + 1);
                stack.pop();
            } else if (isKeyPosition) {
                top.expectKey = false;
                top.empty = false;
            }
            output += text.slice(index, end + 1);
            index = end + 1;
            afterValue = true;
            continue;
        }

        if (character === '{' || character === '[') {
            if (stack.length === 0 && output.trim()) {
                // A second top-level value after the deck closed: stop at the deck.
                break;
            }
            stack.push({ character, outputIndex: output.length, expectKey: character === '{', empty: true });
            output += character;
            index++;
            afterValue = false;
            continue;
        }

        if (character === '}' || character === ']') {
            if (top && CLOSER[top.character] === character) {
                stack.pop();
                output += character;
                afterValue = true;
            }
            // A closer that matches nothing open is dropped.
            index++;
            continue;
        }

        if (character === ',' || character === ':') {
            output += character;
            index++;
            afterValue = false;
            if (character === ',' && top?.character === '{') {
                top.expectKey = true;
            }
            continue;
        }

        // Numbers, true, false, null.
        const literal = text.slice(index).match(/^(-?\d+(\.\d+)?([eE][+-]?\d+)?|true|false|null)/);
        if (!literal) {
            return null;
        }
        output += literal[0];
        index += literal[0].length;
        afterValue = true;
    }

    while (stack.length > 0) {
        output += CLOSER[stack.pop()!.character];
    }

    try {
        JSON.parse(output);
        return output;
    } catch {
        return null;
    }
};
