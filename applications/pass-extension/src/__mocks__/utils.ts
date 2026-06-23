import type { MaybeMessage } from 'proton-pass-extension/types/messages';

export function expectMessageSuccess<T extends MaybeMessage<unknown>>(
    result: T
): asserts result is Extract<T, { type: 'success' }> {
    expect(result.type).toBe('success');
}

export function expectMessageFailure<T extends MaybeMessage<unknown>>(
    result: T
): asserts result is Extract<T, { type: 'error' }> {
    expect(result.type).toBe('error');
}
