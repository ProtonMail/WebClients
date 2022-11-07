import {
    AnimationEvent,
    CSSProperties,
    HTMLAttributes,
    MouseEvent as ReactMouseEvent,
    ReactNode,
    RefObject,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

import { c } from 'ttag';

import { dropdownRootClassName } from '@proton/shared/lib/busy';
import noop from '@proton/utils/noop';

import { classnames, getCustomSizingClasses } from '../../helpers';
import { HotkeyTuple, useCombinedRefs, useDropdownArrowNavigation, useHotkeys, useIsClosing } from '../../hooks';
import { useFocusTrap } from '../focus';
import { PopperPlacement, PopperPosition, allPopperPlacements, usePopper } from '../popper';
import Portal from '../portal/Portal';

interface ContentProps extends HTMLAttributes<HTMLDivElement> {
    ref?: RefObject<HTMLDivElement>;
}

interface Props extends HTMLAttributes<HTMLDivElement> {
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
    noMaxWidth?: boolean;
    noMaxHeight?: boolean;
    noMaxSize?: boolean;
    noCaret?: boolean;
    adaptiveForTouchScreens?: boolean;
    availablePlacements?: PopperPlacement[];
    sameAnchorWidth?: boolean;
    offset?: number;
    autoClose?: boolean;
    autoCloseOutside?: boolean;
    autoCloseOutsideAnchor?: boolean;
    contentProps?: ContentProps;
    disableDefaultArrowNavigation?: boolean;
    UNSTABLE_AUTO_HEIGHT?: boolean;
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
    noMaxWidth = false,
    noMaxHeight = false,
    noMaxSize = false,
    noCaret = false,
    adaptiveForTouchScreens = true,
    disableFocusTrap = false,
    sameAnchorWidth = false,
    autoClose = true,
    autoCloseOutside = true,
    autoCloseOutsideAnchor = true,
    contentProps,
    disableDefaultArrowNavigation = false,
    UNSTABLE_AUTO_HEIGHT,
    ...rest
}: Props) => {
    const [popperEl, setPopperEl] = useState<HTMLDivElement | null>(null);

    const { floating, position, arrow, placement } = usePopper({
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

    const anchorRectRef = useRef<DOMRect | undefined>();
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

    useLayoutEffect(() => {
        if (!isOpen) {
            return;
        }
        if (sameAnchorWidth) {
            anchorRectRef.current = anchorRef.current?.getBoundingClientRect();
        }
    }, [isOpen, sameAnchorWidth]);

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
         * an input field for example, e.g. CountrySelect input)
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
    const popperClassName = classnames([
        dropdownRootClassName,
        noMaxSize && 'dropdown--no-max-size',
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
        '--top': position.top,
        '--left': position.left,
    };

    const staticContentRectWidth = contentRect?.width || undefined;
    const staticContentRectHeight = contentRect?.height || undefined;
    const width = sameAnchorWidth ? anchorRectRef.current?.width : staticContentRectWidth;
    const height = staticContentRectHeight;
    const varSize =
        width !== undefined
            ? {
                  '--width': `${width}`,
                  '--height': `${height}`,
              }
            : {};

    const rootStyle = {
        ...(noMaxHeight ? { '--max-height': 'unset' } : {}),
        ...(noMaxWidth ? { '--max-width': 'unset' } : {}),
        ...style,
        ...varPosition,
        ...varSize,
    };

    const contentStyle = UNSTABLE_AUTO_HEIGHT ? { '--height-custom': 'auto' } : undefined;

    return (
        <Portal>
            <div
                ref={combinedDropdownRef}
                style={{ ...rootStyle, ...style, ...arrow, ...varPosition, ...varSize }}
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
                    style={contentStyle}
                    {...contentProps}
                    ref={combinedContentRef}
                    className={classnames([
                        'dropdown-content',
                        getCustomSizingClasses(contentStyle),
                        contentProps?.className,
                    ])}
                >
                    {children}
                </div>
            </div>
        </Portal>
    );
};

export default Dropdown;
