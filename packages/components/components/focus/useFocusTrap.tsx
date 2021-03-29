import { FocusableElement, isFocusable, tabbable } from 'tabbable';
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

export const getTargetRootElement = (start: Element | null | undefined) => {
    const result = findParentElement(start, (el) => {
        const htmlEl = el as HTMLElement;
        return htmlEl.dataset?.focusRoot === '1';
    });
    return result as HTMLElement | undefined;
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
    disableRestoreByPointer?: boolean;
    enableInitialFocus?: boolean;
}

const useFocusTrap = ({
    active = true,
    enableInitialFocus = true,
    restoreFocus = true,
    preventScroll = true,
    disableRestoreByPointer = true,
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
        let isMouseDownFocusIn = false;
        let mouseUpTime: number | undefined;
        let keyDownTime: number | undefined;

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
            const target = rootElement.querySelector('[data-focus-trap-fallback]');
            if (!target) {
                focusElement(rootElement);
                return;
            }
            focusElement(target as HTMLElement, rootElement);
        };

        const handleFocusIn = (event: FocusEvent) => {
            const { current: rootElement } = rootRef;
            if (!rootElement || !isLastFocusTrap() || !document.hasFocus()) {
                return;
            }
            const targetRootElement = getTargetRootElement(document.activeElement);
            // A new focus trap is going to become active, but has not yet triggered its useEffect, abort.
            if (targetRootElement?.dataset?.focusPending) {
                return;
            }
            // Focus is already in this root.
            if (targetRootElement === rootElement) {
                return;
            }
            if (isMouseDownFocusIn) {
                isMouseDownFocusIn = false;
                return;
            }
            event.stopImmediatePropagation();
            initFocus(rootElement);
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            keyDownTime = Date.now();
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

        const handleMouseDown = () => {
            isMouseDownFocusIn = true;
        };

        const handleMouseUp = () => {
            isMouseDownFocusIn = false;
            mouseUpTime = Date.now();
        };

        document.addEventListener('mousedown', handleMouseDown, true);
        document.addEventListener('mouseup', handleMouseUp, true);
        document.addEventListener('focusin', handleFocusIn, true);
        document.addEventListener('keydown', handleKeyDown, true);

        return () => {
            document.removeEventListener('focusin', handleFocusIn, true);
            document.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('mousedown', handleMouseDown, true);
            document.removeEventListener('mouseup', handleMouseUp, true);

            manager.remove(id);

            const currentActiveElement = document.activeElement;
            const targetRootElement = getTargetRootElement(currentActiveElement);

            const isFocusInAnotherRoot = targetRootElement && targetRootElement !== rootRef.current;
            const isFocusInThisRoot = targetRootElement && targetRootElement === rootRef.current;
            const isCurrentActiveElementFocusable = currentActiveElement && isFocusable(currentActiveElement);

            // Determine if this focus trap became inactive because of a pointer action, or if it was closed by 'esc'
            const isClosedByPointer = (mouseUpTime || 0) > (keyDownTime || 0);

            const nodeToRestore = nodeToRestoreRef.current as HTMLElement | undefined;
            nodeToRestoreRef.current = null;
            if (
                !restoreFocus ||
                (disableRestoreByPointer && isClosedByPointer) ||
                !nodeToRestore ||
                isFocusInAnotherRoot ||
                (!isFocusInThisRoot && isCurrentActiveElementFocusable)
            ) {
                return;
            }
            nodeToRestore.focus?.();
        };
    }, [active]);

    return active
        ? {
              ...(pendingRef.current && { 'data-focus-pending': pendingRef.current }),
              'data-focus-root': '1',
              tabIndex: -1,
          }
        : {
              'data-focus-root': '1',
          };
};

export default useFocusTrap;
