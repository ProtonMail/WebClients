import { createContext, useContext } from 'react';

import { useSelector } from '@xstate/react';
import type { ActorRefFrom, AnyActorLogic } from 'xstate';

/** The snapshot `useSelector` hands the selector, written the way it declares it so the generic types line up. */
type SnapshotOf<TActorRef> = TActorRef extends { getSnapshot(): infer TSnapshot } ? TSnapshot : undefined;

/**
 * Like `createActorContext`, but for an actor the sign-in machine already runs (an invoked child), which
 * `createActorContext` can't take: the step that finds the child provides its ref, and the components below read it
 * without props.
 */
export const createChildActorContext = <TLogic extends AnyActorLogic>(name: string) => {
    const Context = createContext<ActorRefFrom<TLogic> | null>(null);
    Context.displayName = name;

    const useActorRef = (): ActorRefFrom<TLogic> => {
        const actorRef = useContext(Context);
        if (actorRef === null) {
            throw new Error(`${name} is used outside its provider`);
        }
        return actorRef;
    };

    return {
        Provider: Context.Provider,
        useActorRef,
        useSelector: <T>(
            selector: (snapshot: SnapshotOf<ActorRefFrom<TLogic>>) => T,
            compare?: (a: T, b: T) => boolean
        ) => useSelector(useActorRef(), selector, compare),
    };
};
