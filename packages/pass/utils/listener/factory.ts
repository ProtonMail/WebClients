import type { Callback, Maybe } from '@proton/pass/types';

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
      }
    | {
          kind: 'resizeObserver';
          observer: ResizeObserver;
      };

export type ListenerStore = ReturnType<typeof createListenerStore>;

export const createListenerStore = () => {
    const listeners: Listener[] = [];

    const cancelDebounce = (fn: Callback) => (fn as any)?.cancel?.();

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

    const addObserver = (target: Node, mutationCb: MutationCallback, options?: MutationObserverInit) => {
        const observer = new MutationObserver(mutationCb);

        const disconnect = observer.disconnect;

        observer.disconnect = () => {
            cancelDebounce(mutationCb);
            disconnect.bind(observer)();
        };

        listeners.push({ kind: 'observer', observer });
        observer.observe(target, options);
    };

    const addResizeObserver = (target: Element, resizeCb: ResizeObserverCallback) => {
        const observer = new ResizeObserver(resizeCb);
        const disconnect = observer.disconnect;

        observer.disconnect = () => {
            cancelDebounce(resizeCb);
            disconnect.bind(observer)();
        };

        listeners.push({ kind: 'resizeObserver', observer });
        observer.observe(target);
    };

    const removeAll = () => {
        listeners.forEach((listener) => {
            switch (listener.kind) {
                case 'observer':
                case 'resizeObserver':
                    return listener.observer.disconnect();
                case 'listener': {
                    cancelDebounce(listener.fn);
                    return listener.element.removeEventListener(listener.type, listener.fn);
                }
            }
        });

        listeners.length = 0;
    };

    return {
        addListener,
        addObserver,
        addResizeObserver,
        removeAll,
    };
};
