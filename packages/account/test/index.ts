import type { ModelState } from '../interface';

export const getModelState = <T>(value: T | undefined, error = undefined): ModelState<T> => {
    return {
        value,
        error,
        meta: {
            fetchedAt: Date.now(),
        },
    };
};
