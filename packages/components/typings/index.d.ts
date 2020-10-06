declare module '*.svg';

declare module '*.jpg';

declare module '*.md';

// TODO: Import from proton-shared
declare module 'ical.js';

declare module 'squire-rte';

declare module 'pm-srp';

declare module 'is-valid-domain';

declare class ResizeObserver {
    constructor(callback: ResizeObserverCallback);
    disconnect: () => void;

    observe: (target: Element, options?: ResizeObserverOptions) => void;

    unobserve: (target: Element) => void;
}

type ResizeObserverOptions = {
    box?: 'content-box' | 'border-box';
};

type ResizeObserverCallback = (entries: ResizeObserverEntry[], observer: ResizeObserver) => void;

interface ResizeObserverEntry {
    readonly borderBoxSize: ResizeObserverEntryBoxSize;
    readonly contentBoxSize: ResizeObserverEntryBoxSize;
    readonly contentRect: DOMRectReadOnly;
    readonly target: Element;
}

interface ResizeObserverEntryBoxSize {
    blockSize: number;
    inlineSize: number;
}
