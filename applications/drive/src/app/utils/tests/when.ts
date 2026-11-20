import type { Mock } from 'vitest';

type Entry = {
    expected: unknown[];
    kind: 'value' | 'resolve' | 'reject';
    value: unknown;
    once: boolean;
    called: boolean;
};

type Registry = { entries: Entry[]; dispatcher: (...args: any[]) => unknown };

const registries = new WeakMap<Mock<any>, Registry>();
const allEntries = new Set<Entry>();

const matches = (expected: unknown[], args: unknown[]) => {
    try {
        expect(args).toEqual(expected);
        return true;
    } catch {
        return false;
    }
};

const getRegistry = (mock: Mock<any>): Registry => {
    const existing = registries.get(mock);
    // The mock implementation was reset or replaced since: drop the stale entries
    if (existing && mock.getMockImplementation() === existing.dispatcher) {
        return existing;
    }
    // Calls that match no answer fall back to what the mock did before, as with jest-when
    const fallback = mock.getMockImplementation();
    const registry: Registry = {
        entries: [],
        dispatcher: (...args: unknown[]) => {
            const index = registry.entries.findIndex((entry) => matches(entry.expected, args));
            if (index === -1) {
                return (fallback as ((...args: unknown[]) => unknown) | undefined)?.(...args);
            }
            const entry = registry.entries[index];
            entry.called = true;
            if (entry.once) {
                registry.entries.splice(index, 1);
            }
            if (entry.kind === 'resolve') {
                return Promise.resolve(entry.value);
            }
            if (entry.kind === 'reject') {
                return Promise.reject(entry.value);
            }
            return entry.value;
        },
    };
    registries.set(mock, registry);
    mock.mockImplementation(registry.dispatcher);
    return registry;
};

/**
 * Minimal replacement of `jest-when`: answers a mock depending on the arguments it is called with.
 * Arguments are compared with `toEqual`, so asymmetric matchers (`expect.any(...)`) work.
 */
export const when = (mock: Mock<any> | ((...args: any[]) => any)) => ({
    calledWith: (...expected: unknown[]) => {
        const add = (kind: Entry['kind'], value: unknown, once: boolean) => {
            const registry = getRegistry(mock as Mock<any>);
            const entry: Entry = { expected, kind, value, once, called: false };
            if (once) {
                // One-shot answers go first, in order, then the permanent ones
                const firstPermanent = registry.entries.findIndex((existing) => !existing.once);
                registry.entries.splice(firstPermanent === -1 ? registry.entries.length : firstPermanent, 0, entry);
            } else {
                // The newest permanent answer for the same arguments wins, as with jest-when
                registry.entries = registry.entries.filter((existing) => {
                    const replaced = !existing.once && matches(existing.expected, expected);
                    if (replaced) {
                        allEntries.delete(existing);
                    }
                    return !replaced;
                });
                registry.entries.push(entry);
            }
            allEntries.add(entry);
        };
        return {
            mockReturnValue: (value: unknown) => add('value', value, false),
            mockReturnValueOnce: (value: unknown) => add('value', value, true),
            mockResolvedValue: (value: unknown) => add('resolve', value, false),
            mockResolvedValueOnce: (value: unknown) => add('resolve', value, true),
            mockRejectedValue: (value: unknown) => add('reject', value, false),
            mockRejectedValueOnce: (value: unknown) => add('reject', value, true),
        };
    },
});

/** Fails if an answer registered with `when(...).calledWith(...)` was never used. */
export const verifyAllWhenMocksCalled = () => {
    const uncalled = [...allEntries].filter((entry) => !entry.called);
    allEntries.clear();
    expect(uncalled.map((entry) => entry.expected)).toEqual([]);
};
