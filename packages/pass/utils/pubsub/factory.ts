import type { MaybePromise } from '@proton/pass/types';
import { safeCall } from '@proton/pass/utils/fp/safe-call';

export type Subscriber<E> = (event: E) => MaybePromise<any>;

export interface PubSub<E> {
    subscribe: (subscriber: Subscriber<E>) => () => void;
    unsubscribe: () => void;
    publish: (event: E) => void;
    /** Publishes an event and wait for all subscribers to have resolved.
     * If any subscribers reject, `publishAsync` will throw. */
    publishAsync: (event: E) => Promise<void>;
}

type PubSubContext<E> = {
    subscribers: { [key: number]: Subscriber<E> };
    subscriberId: number;
};
export const createPubSub = <E extends any>(): PubSub<E> => {
    const ctx: PubSubContext<E> = {
        subscribers: {},
        subscriberId: 0,
    };

    const subscribe = (subscriber: Subscriber<E>) => {
        const id = ctx.subscriberId++;
        ctx.subscribers[id] = subscriber;

        return () => delete ctx.subscribers[id];
    };

    const unsubscribe = () => (ctx.subscribers = {});

    const publish = (event: E) => {
        Object.values(ctx.subscribers).forEach((subscriber) => safeCall(subscriber)(event));
    };

    const publishAsync = async (event: E) => {
        await Promise.all(Object.values(ctx.subscribers).map((subscriber) => subscriber(event)));
    };

    return { publish, publishAsync, subscribe, unsubscribe };
};
