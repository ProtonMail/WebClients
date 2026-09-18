import type { Entry } from '@proton/proton-foundation-search';

import { engineCall } from '../../index/engineCall';

/** Read the first value of a tag attribute off an exported `Entry`, or `undefined` if absent. */
export function readSearchLibraryTagAttribute(entry: Entry, name: string): string | undefined {
    return engineCall(`read tag attribute <${name}>`, () => {
        const values = entry.attribute(name);
        let found: string | undefined;
        for (const ev of values) {
            if (found === undefined) {
                const raw = ev.value();
                if (typeof raw === 'string') {
                    found = raw;
                }
            }
            ev.free();
        }
        return found;
    });
}

/** Read the first value of an integer attribute off an exported `Entry`, or `undefined` if absent. */
export function readSearchLibraryIntegerAttribute(entry: Entry, name: string): number | undefined {
    return engineCall(`read integer attribute <${name}>`, () => {
        const values = entry.attribute(name);
        let found: number | undefined;
        for (const ev of values) {
            if (found === undefined) {
                const raw = ev.value();
                // WASM returns integer attributes as plain `number` on export, even though
                // they were written via `Value.int(bigint)`. Values always originate from
                // `BigInt(…)` wrapping a `number` in `createIndexEntry`, so the round-trip
                // to a plain `number` is lossless for our use.
                if (typeof raw === 'number') {
                    found = raw;
                } else if (typeof raw === 'bigint') {
                    found = Number(raw);
                }
            }
            ev.free();
        }
        return found;
    });
}
