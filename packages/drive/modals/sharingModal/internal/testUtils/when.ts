import type { Mock } from 'vitest';

type Stub = { args: unknown[]; once: boolean; used: boolean; run: () => unknown };

const stubsByMock = new WeakMap<Mock, { stubs: Stub[]; dispatcher: (...args: any[]) => unknown }>();

const argsMatch = (expected: unknown[], actual: unknown[]) => {
    try {
        expect(actual).toEqual(expected);
        return true;
    } catch {
        return false;
    }
};

/**
 * Minimal argument-matching stubs for a `vi.fn()`: `when(fn).calledWith(...args).mockResolvedValue(value)`.
 * The most recent matching stub wins.
 *
 * Differences from `jest-when`:
 * - A call that matches no stub returns `undefined`, it does not fall back to the mock's own implementation.
 * - `when` owns the mock's implementation: if the test replaced or reset it (`mockReset`, `mockResolvedValue`...),
 *   the next `when(fn)` call installs a fresh dispatcher and drops the earlier stubs.
 */
export const when = <T extends Mock>(fn: T) => {
    let entry = stubsByMock.get(fn);
    if (!entry || fn.getMockImplementation() !== entry.dispatcher) {
        const registered: Stub[] = [];
        const dispatcher = (...actual: unknown[]) => {
            for (let i = registered.length - 1; i >= 0; i--) {
                const stub = registered[i];
                if (stub.once && stub.used) {
                    continue;
                }
                if (argsMatch(stub.args, actual)) {
                    stub.used = true;
                    return stub.run();
                }
            }
            return undefined;
        };
        entry = { stubs: registered, dispatcher };
        stubsByMock.set(fn, entry);
        fn.mockImplementation(dispatcher);
    }
    const registered = entry.stubs;
    return {
        calledWith: (...args: unknown[]) => {
            const add = (run: () => unknown, once = false) => {
                registered.push({ args, once, used: false, run });
            };
            return {
                mockReturnValue: (value: unknown) => add(() => value),
                mockResolvedValue: (value: unknown) => add(() => Promise.resolve(value)),
                mockResolvedValueOnce: (value: unknown) => add(() => Promise.resolve(value), true),
                mockRejectedValue: (error: unknown) => add(() => Promise.reject(error)),
            };
        },
    };
};
