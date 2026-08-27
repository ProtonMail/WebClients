import type { ModelState } from '@proton/redux-utilities/initialModelState/interface';

export const getModelState = <T>(value: T | undefined, error = undefined): ModelState<T> => {
    return {
        value,
        error,
        meta: {
            fetchedAt: Date.now(),
            fetchedEphemeral: true,
        },
    };
};
