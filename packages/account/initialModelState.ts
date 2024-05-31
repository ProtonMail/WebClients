import type { ModelState } from './interface';

export const getInitialModelState = <T>(value?: T | undefined): ModelState<T> => {
    return {
        value,
        error: undefined,
        meta: {
            fetchedAt: 0,
        },
    };
};
