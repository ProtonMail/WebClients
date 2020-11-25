import { FocusableElement, tabbable } from 'tabbable';
import { MutableRefObject, useEffect, useRef, useState } from 'react';

const findParentElement = (el: Element | null | undefined, cb: (el: Element) => boolean) => {
    let nextEl = el;
    while (nextEl) {
        if (cb(nextEl)) {
            return nextEl;
        }
        nextEl = nextEl.parentElement;
    }
};

const manager = (() => {
    const data: any[] = [];
    const remove = (item: any) => {
        const idx = data.indexOf(item);
        if (idx === -1) {
            return;
        }
        data.splice(idx, 1);
    };
    return {
        add: (item: any) => {
            data.push(item);
            return () => {
                remove(item);
            };
        },
        isLast: (item: any) => (data.length ? data[data.length - 1] === item : false),
        remove,
    };
})();

interface Props {
    rootRef: MutableRefObject<HTMLDivElement | null>;
    active?: boolean;
    restoreFocus?: boolean;
    preventScroll?: boolean;
    enableInitialFocus?: boolean;
}

const useFocusTrap = ({
    active = true,
    enableInitialFocus = true,
    restoreFocus = true,
    preventScroll = true,
    rootRef,
}: Props) => {
    const [id] = useState({});

    const nodeToRestoreRef = useRef<Element | null>(null);
    const prevOpenRef = useRef(false);
    const pendingRef = useRef('');

    useEffect(() => {
        prevOpenRef.current = active;
    }, [active]);

    if (!prevOpenRef.current && active) {
        pendingRef.current = '1';
        nodeToRestoreRef.current = document.activeElement;
    }

    useEffect(() => {
        if (!active || !rootRef.current) {
            return;
        }

        manager.add(id);

        const isLastFocusTrap = () => {
            return manager.isLast(id);
        };

        rootRef.current.removeAttribute('data-focus-pending');
        pendingRef.current = '';

        const focusElement = (node?: FocusableElement | HTMLElement | null, fallback?: HTMLElement) => {
            if (node === document.activeElement) {
                return;
            }
            if (!node?.focus) {
                focusElement(fallback);
                return;
            }
            node.focus({ preventScroll: !!preventScroll });
        };

        const initFocus = (rootElement: HTMLElement) => {
            const tabbableElements = tabbable(rootElement, { includeContainer: false });
            if (!tabbableElements.length) {
                focusElement(rootElement);
                return;
            }
            // Preference to elements with focus-fallback
            const tabbableElementsSorted = [...tabbableElements].sort(
                (a, b) => parseInt(b.dataset.focusFallback || '0', 10) - parseInt(a.dataset.focusFallback || '0', 10)
            );
            focusElement(tabbableElementsSorted[0], rootElement);
        };

        const handleFocusIn = (event: FocusEvent) => {
            const { current: rootElement } = rootRef;
            if (!rootElement || !isLastFocusTrap() || !document.hasFocus()) {
                return;
            }
            const targetRootElement = findParentElement(document.activeElement, (el) => {
                const htmlEl = el as HTMLElement;
                return htmlEl.dataset?.focusRoot === '1';
            }) as HTMLElement;
            // A new focus trap is going to become active, but has not yet triggered its useEffect, abort.
            if (targetRootElement?.dataset?.focusPending) {
                return;
            }
            // Focus is already in this root.
            if (targetRootElement === rootElement) {
                return;
            }
            event.stopImmediatePropagation();
            initFocus(rootElement);
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isLastFocusTrap() || event.key !== 'Tab' || !rootRef.current) {
                return;
            }
            const { current: rootElement } = rootRef;
            const tabbableElements = tabbable(rootElement, { includeContainer: false });
            if (tabbableElements.length === 0) {
                focusElement(rootElement);
                return;
            }
            const firstTabbableNode = tabbableElements[0];
            const lastTabbableNode = tabbableElements[tabbableElements.length - 1];
            if (event.shiftKey && event.target === firstTabbableNode) {
                event.preventDefault();
                focusElement(lastTabbableNode, rootElement);
            }
            if (!event.shiftKey && event.target === lastTabbableNode) {
                event.preventDefault();
                focusElement(firstTabbableNode, rootElement);
            }
        };

        // If the current focused element is not in this root. E.g. no autoFocus
        if (!rootRef.current.contains(document.activeElement)) {
            // If the first tabbable element should not be focused, fall back to the container
            if (!enableInitialFocus) {
                focusElement(rootRef.current);
            } else {
                initFocus(rootRef.current);
            }
        }

        document.addEventListener('focusin', handleFocusIn, true);
        document.addEventListener('keydown', handleKeyDown, true);

        return () => {
            document.removeEventListener('focusin', handleFocusIn, true);
            document.removeEventListener('keydown', handleKeyDown, true);

            manager.remove(id);

            if (restoreFocus) {
                const nodeToRestore = nodeToRestoreRef.current as HTMLElement;
                nodeToRestore?.focus?.();
            }
            nodeToRestoreRef.current = null;
        };
    }, [active]);

    return {
        ...(pendingRef.current && { 'data-focus-pending': pendingRef.current }),
        'data-focus-root': '1',
        tabIndex: -1,
    };
};

export default useFocusTrap;
