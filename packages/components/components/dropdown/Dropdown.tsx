import type {
    AnimationEvent,
    CSSProperties,
    HTMLAttributes,
    MouseEvent as ReactMouseEvent,
    ReactNode,
    RefObject,
} from 'react';
import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import useFocusTrap from '@proton/components/components/focus/useFocusTrap';
import { useCombinedRefs } from '@proton/hooks';
import { dropdownRootClassName } from '@proton/shared/lib/busy';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import useDropdownArrowNavigation from '../../hooks/useDropdownArrowNavigation';
import useElementRect from '../../hooks/useElementRect';
import type { HotkeyTuple } from '../../hooks/useHotkeys';
import { useHotkeys } from '../../hooks/useHotkeys';
import useIsClosing from '../../hooks/useIsClosing';
import type { PopperPlacement, PopperPosition } from '../popper';
import { allPopperPlacements, usePopper } from '../popper';
import Portal from '../portal/Portal';
import type { DropdownSize } from './utils';
import { DropdownSizeUnit, getHeightValue, getMaxSizeValue, getProp, getWidthValue } from './utils';

interface ContentProps extends HTMLAttributes<HTMLDivElement> {
    ref?: RefObject<HTMLDivElement>;
}

export interface DropdownProps extends HTMLAttributes<HTMLDivElement> {
    anchorRef: RefObject<HTMLElement>;
    anchorPosition?: PopperPosition | null;
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
    onClose?: (event?: ReactMouseEvent<HTMLDivElement> | Event) => void;
    onClosed?: () => void;
    onContextMenu?: (event: ReactMouseEvent<HTMLDivElement, MouseEvent>) => void;
    originalPlacement?: PopperPlacement;
    disableFocusTrap?: boolean;
    isOpen?: boolean;
    size?: DropdownSize;
    noCaret?: boolean;
    adaptiveForTouchScreens?: boolean;
    availablePlacements?: PopperPlacement[];
    offset?: number;
    autoClose?: boolean;
    autoCloseOutside?: boolean;
    autoCloseOutsideAnchor?: boolean;
    contentProps?: ContentProps;
    disableDefaultArrowNavigation?: boolean;
}

const Dropdown = ({
    anchorRef,
    anchorPosition,
    children,
    className,
    style,
    originalPlacement = 'bottom',
    availablePlacements = allPopperPlacements,
    offset = 8,
    onClose = noop,
    onClosed,
    onContextMenu = noop,
    isOpen = false,
    size,
    noCaret = false,
    adaptiveForTouchScreens = true,
    disableFocusTrap = false,
    autoClose = true,
    autoCloseOutside = true,
    autoCloseOutsideAnchor = true,
    contentProps,
    disableDefaultArrowNavigation = false,
    ...rest
}: DropdownProps) => {
    const [popperEl, setPopperEl] = useState<HTMLDivElement | null>(null);
    const anchorRect = useElementRect(isOpen && size?.width === DropdownSizeUnit.Anchor ? anchorRef : null);

    const {
        floating,
        position,
        arrow,
        placement,
        availableSize: varAvailableSize,
    } = usePopper({
        reference:
            anchorPosition || anchorPosition === null
                ? {
                      mode: 'position',
                      value: anchorPosition,
                      anchor: anchorRef.current,
                  }
                : {
                      mode: 'element',
                      value: anchorRef.current,
                  },
        isOpen,
        originalPlacement,
        availablePlacements,
        availableSize: true,
        offset,
    });

    /*
     * It seems that inputs of type radio trigger a synthetic click event when navigating them via keyboard.
     * For the use-case where we want to auto-close the dropdown but not close the dropdown
     * when navigating radio inputs inside of the dropdown, we can verify clientX & ClientY of the MouseEvent
     * as the synthetically generated click event contains 0 for these value.
     */
    const handleClickContent = (event: ReactMouseEvent<HTMLDivElement>) => {
        const isRealClick = event.clientX !== 0 && event.clientY !== 0;

        if (isRealClick && autoClose) {
            onClose(event);
        }
    };

    const rootRef = useRef<HTMLDivElement>(null);
    const combinedDropdownRef = useCombinedRefs<HTMLDivElement>(rootRef, setPopperEl, floating);

    const contentRef = useRef<HTMLDivElement>(null);
    const combinedContentRef = useCombinedRefs(contentRef, contentProps?.ref);

    const [contentRect, setContentRect] = useState<DOMRect | undefined>();

    const focusTrapProps = useFocusTrap({ rootRef, active: isOpen && !disableFocusTrap, enableInitialFocus: false });

    const { shortcutHandlers: arrowNavigationShortcutHandlers } = useDropdownArrowNavigation({
        rootRef,
    });

    const defaultShortcutHandlers: HotkeyTuple = [
        'Escape',
        (e) => {
            e.stopPropagation();
            onClose?.();
        },
    ];

    const hotkeyTuples = disableDefaultArrowNavigation
        ? [defaultShortcutHandlers]
        : [...arrowNavigationShortcutHandlers, defaultShortcutHandlers];

    useHotkeys(rootRef, hotkeyTuples, {
        dependencies: [isOpen, !disableDefaultArrowNavigation],
    });

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleClickOutside = ({ target }: MouseEvent) => {
            const targetNode = target as HTMLElement;
            const anchorEl = anchorRef.current;
            // Do nothing if clicking ref's element or descendent elements
            if (
                !autoCloseOutside ||
                (autoCloseOutsideAnchor && anchorEl?.contains(targetNode)) ||
                popperEl?.contains(targetNode) ||
                targetNode.dataset?.ignoreClose
            ) {
                return;
            }
            onClose();
        };

        /*
         * In iOS Safari 12 (and maybe below), given the following scenario:
         * Html <input /> nested inside of a <label /> with connecting "for" attributes
         *
         * The behaviour on click inside said label seems to be the following:
         * Emit one click event with the target of the clicked element (imagine an icon inside
         * an input field for example, e.g. PhoneCountrySelect input)
         * Emit a second click event seemingly coming from and with the target being the input
         * element which is linked to the label via the "for" attribute OR whichever input
         * element is the first to appear in the children of the label.
         *
         * This behaviour causes the check for a click on the anchor element not to work if the
         * anchor element is a child of the label but not the input itself. A dropdown is
         * immediately closed as soon as opened because there are two click events emitted, one
         * of which claims to not have been emitted from the anchor element.
         *
         * I'm assuming that bubbling is a fully synchronous operation here. Given this, delaying
         * the attachement of this click-outside event-listener to a later call-stack seems to deal
         * with this issue (as it can't listen to it's own bubbled click event any longer).
         */
        const timeoutId = setTimeout(() => {
            document.addEventListener('dropdownclose', onClose);
            document.addEventListener('click', handleClickOutside, { capture: true });
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('dropdownclose', onClose);
            document.removeEventListener('click', handleClickOutside, { capture: true });
        };
    }, [isOpen, autoCloseOutside, onClose, anchorRef.current, popperEl]);

    const [isClosing, isClosed, setIsClosed] = useIsClosing(isOpen);
    const popperClassName = clsx([
        dropdownRootClassName,
        `dropdown--${placement}`,
        isClosing && `is-dropdown-out`,
        noCaret && 'dropdown--no-caret',
        adaptiveForTouchScreens && 'adaptive-for-touch-screens',
        className,
        'outline-none',
    ]);

    if (isClosed && !isOpen) {
        return null;
    }

    const varPosition = {
        '--top': `${position.top}px`,
        '--left': `${position.left}px`,
    };

    const varSize = {
        ...getProp('--width', getWidthValue(size?.width, anchorRect, contentRect)),
        ...getProp('--height', getHeightValue(size?.height, anchorRect, contentRect)),
    };

    const varMaxSize = {
        ...getProp('--custom-max-width', getMaxSizeValue(size?.maxWidth)),
        ...getProp('--custom-max-height', getMaxSizeValue(size?.maxHeight)),
    };

    const rootStyle = {
        ...style,
        ...varPosition,
        ...varMaxSize,
        ...varAvailableSize,
        ...varSize,
        ...arrow,
    };

    return (
        <Portal>
            <div
                ref={combinedDropdownRef}
                style={rootStyle}
                role="dialog"
                className={popperClassName}
                onClick={handleClickContent}
                onAnimationEnd={({ animationName }: AnimationEvent) => {
                    if (animationName.includes('anime-dropdown-out') && isClosing) {
                        setIsClosed();
                        setContentRect(undefined);
                        onClosed?.();
                    }
                    if (animationName.includes('anime-dropdown-in') && isOpen && contentRef.current && !contentRect) {
                        const contentClientRect = contentRef.current?.getBoundingClientRect();
                        setContentRect(contentClientRect);
                    }
                }}
                onContextMenu={onContextMenu}
                data-testid="dropdown-button"
                {...rest}
                {...focusTrapProps}
            >
                {/* Backdrop button, meant to override 'autoClose' option on mobile */}
                <div
                    role="button"
                    tabIndex={0}
                    data-ignore-close="true"
                    className="dropdown-backdrop"
                    title={c('Action').t`Close`}
                    onClick={onClose}
                >
                    <span className="sr-only">{c('Action').t`Close`}</span>
                </div>
                <div
                    {...contentProps}
                    ref={combinedContentRef}
                    className={clsx(['dropdown-content', contentProps?.className])}
                >
                    {children}
                </div>
            </div>
        </Portal>
    );
};

export default Dropdown;
