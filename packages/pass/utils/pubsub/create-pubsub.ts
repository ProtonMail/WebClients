export type Subscriber<E> = (event: E) => void;

export interface PubSub<E> {
    subscribe: (subscriber: Subscriber<E>) => void;
    unsubscribe: () => void;
    publish: (event: E) => void;
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
        Object.values(ctx.subscribers).forEach((subscriber) => subscriber(event));
    };

    return { publish, subscribe, unsubscribe };
};
