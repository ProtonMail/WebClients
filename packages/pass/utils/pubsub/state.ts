import type { Subscriber } from '@proton/pass/utils/pubsub/factory';
import { createPubSub } from '@proton/pass/utils/pubsub/factory';

export interface ObservableState<T> {
    getState: () => T;
    setState: (value: T | ((prev: T) => T)) => void;
    subscribe: (listener: Subscriber<T>) => () => void;
}
/** Creates an observable state container that can be
 * accessed both inside and outside React components.  */
export const createObservableState = <T>(state: T): ObservableState<T> => {
    const pubsub = createPubSub<T>();
    const ctx: { state: T } = { state };

    return {
        getState: () => ctx.state,
        setState: (value) => {
            const next = value instanceof Function ? value(ctx.state) : value;
            ctx.state = next;
            pubsub.publish(next);
        },

        subscribe: pubsub.subscribe,
    };
};
