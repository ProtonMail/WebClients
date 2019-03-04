import { CREATE_PROMISE, REJECT_PROMISE, RESET_PROMISES, RESOLVE_PROMISE } from './actionTypes';

export default (promiseResolver) => {
    return () => (next) => (action) => {
        if (!action.type) {
            return next(action);
        }

        const { type, payload } = action;

        if (type === CREATE_PROMISE) {
            const { id, promise } = promiseResolver.create(payload.id);
            next({
                type: CREATE_PROMISE,
                payload: {
                    ...payload,
                    id
                }
            });
            return promise;
        }

        if (type === RESOLVE_PROMISE) {
            next(action);
            promiseResolver.resolve(payload.id, payload.value);
            return;
        }

        if (type === REJECT_PROMISE) {
            next(action);
            promiseResolver.reject(payload.id, payload.value);
            return;
        }

        if (type === RESET_PROMISES) {
            next(action);
            promiseResolver.reject();
            return;
        }

        return next(action);
    };
};
