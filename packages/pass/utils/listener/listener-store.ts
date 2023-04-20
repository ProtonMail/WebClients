import type { Maybe } from '@proton/pass/types';

/**
 * Removing every listener from a DOM node
 * can be achieved by cloning the node and
 * replacing it in-place
 */
export const removeListeners = (el: HTMLElement): void => {
    el.replaceWith(el.cloneNode(true));
};

type EventSource = Window | Document | HTMLElement;

type EventMap<T extends EventSource> = T extends Window
    ? WindowEventMap
    : T extends Document
    ? DocumentEventMap
    : T extends HTMLElement
    ? HTMLElementEventMap
    : never;

type EventType<T extends EventSource, E extends keyof EventMap<T>> = EventMap<T>[E];

export type Listener<T extends EventSource = any, E extends keyof EventMap<T> = any> =
    | {
          kind: 'listener';
          fn: (e: EventType<T, E>) => void;
          element: T;
          type: E;
      }
    | {
          kind: 'observer';
          observer: MutationObserver;
      };

export type ListenerStore = ReturnType<typeof createListenerStore>;

export const createListenerStore = () => {
    const listeners: Listener[] = [];

    const addListener = <T extends EventSource, E extends keyof EventMap<T>>(
        element: Maybe<T>,
        type: E,
        fn: (e: EventType<T, E>) => void
    ) => {
        if (element !== undefined) {
            listeners.push({ kind: 'listener', element, type, fn });
            (element as any).addEventListener(type, fn);
        }
    };

    const addObserver = (mutationCb: MutationCallback, target: Node, options?: MutationObserverInit) => {
        const observer = new MutationObserver(mutationCb);
        listeners.push({ kind: 'observer', observer });
        observer.observe(target, options);
    };

    const removeAll = () => {
        listeners.forEach((listener) => {
            if (listener.kind === 'listener') {
                listener.element.removeEventListener(listener.type, listener.fn);
            }

            if (listener.kind === 'observer') {
                listener.observer.disconnect();
            }
        });
    };

    return {
        addListener,
        addObserver,
        removeAll,
    };
};
