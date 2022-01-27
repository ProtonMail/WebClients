import {
    useEffect,
    useState,
    useRef,
    CSSProperties,
    useLayoutEffect,
    AnimationEvent,
    HTMLAttributes,
    RefObject,
    ReactNode,
    MouseEvent as ReactMouseEvent,
} from 'react';
import { c } from 'ttag';
import { noop } from '@proton/shared/lib/helpers/function';
import { dropdownRootClassName } from '@proton/shared/lib/busy';
import { useIsClosing, useCombinedRefs, useHotkeys, useDropdownArrowNavigation, HotkeyTuple } from '../../hooks';
import { classnames, getCustomSizingClasses } from '../../helpers';
import useRightToLeft from '../../containers/rightToLeft/useRightToLeft';
import { usePopper } from '../popper';
import { ALL_PLACEMENTS, Position } from '../popper/utils';
import Portal from '../portal/Portal';

import { useFocusTrap } from '../focus';

interface ContentProps extends HTMLAttributes<HTMLDivElement> {
    ref?: RefObject<HTMLDivElement>;
}

interface Props extends HTMLAttributes<HTMLDivElement> {
    anchorRef: RefObject<HTMLElement>;
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
    onClose?: (event?: ReactMouseEvent<HTMLDivElement> | Event) => void;
    onClosed?: () => void;
    onContextMenu?: (event: ReactMouseEvent<HTMLDivElement, MouseEvent>) => void;
    originalPlacement?: string;
    disableFocusTrap?: boolean;
    isOpen?: boolean;
    noMaxWidth?: boolean;
    noMaxHeight?: boolean;
    noMaxSize?: boolean;
    noCaret?: boolean;
    availablePlacements?: string[];
    originalPosition?: Position;
    sameAnchorWidth?: boolean;
    offset?: number;
    autoClose?: boolean;
    autoCloseOutside?: boolean;
    autoCloseOutsideAnchor?: boolean;
    contentProps?: ContentProps;
    disableDefaultArrowNavigation?: boolean;
    updatePositionOnDOMChange?: boolean;
    UNSTABLE_AUTO_HEIGHT?: boolean;
}

const Dropdown = ({
    anchorRef,
    children,
    className,
    style,
    originalPlacement = 'bottom',
    availablePlacements = ALL_PLACEMENTS,
    originalPosition,
    offset = 8,
    onClose = noop,
    onClosed,
    onContextMenu = noop,
    isOpen = false,
    noMaxWidth = false,
    noMaxHeight = false,
    noMaxSize = false,
    noCaret = false,
    disableFocusTrap = false,
    sameAnchorWidth = false,
    autoClose = true,
    autoCloseOutside = true,
    autoCloseOutsideAnchor = true,
    contentProps,
    disableDefaultArrowNavigation = false,
    updatePositionOnDOMChange = true,
    UNSTABLE_AUTO_HEIGHT,
    ...rest
}: Props) => {
    const [isRTL] = useRightToLeft();
    const rtlAdjustedPlacement = originalPlacement.includes('right')
        ? originalPlacement.replace('right', 'left')
        : originalPlacement.replace('left', 'right');

    const [popperEl, setPopperEl] = useState<HTMLDivElement | null>(null);

    const { position, placement } = usePopper({
        popperEl,
        anchorEl: anchorRef.current,
        isOpen,
        originalPlacement: isRTL ? rtlAdjustedPlacement : originalPlacement,
        availablePlacements,
        originalPosition,
        offset,
        updatePositionOnDOMChange,
    });

    const handleClickContent = (event: ReactMouseEvent<HTMLDivElement>) => {
        if (autoClose) {
            onClose(event);
        }
    };

    const rootRef = useRef<HTMLDivElement>(null);
    const combinedContainerRef = useCombinedRefs<HTMLDivElement>(rootRef, setPopperEl);

    const contentRef = useRef<HTMLDivElement>(null);

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
    }, [isOpen]);

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

    const varSize =
        contentRect || anchorRectRef.current
            ? {
                  '--width': `${anchorRectRef.current?.width || contentRect?.width}`,
                  '--height': `${contentRect?.height || undefined}`,
              }
            : {};

    const handleAnimationEnd = ({ animationName }: AnimationEvent) => {
        if (animationName.includes('anime-dropdown-out') && isClosing) {
            setIsClosed();
            setContentRect(undefined);
            onClosed?.();
        }
        if (animationName.includes('anime-dropdown-in') && isOpen && contentRef.current && !contentRect) {
            const contentClientRect = contentRef.current?.getBoundingClientRect();
            setContentRect(contentClientRect);
        }
    };

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
                ref={combinedContainerRef}
                style={{ ...rootStyle, ...style, ...varPosition, ...varSize }}
                role="dialog"
                className={popperClassName}
                onClick={handleClickContent}
                onAnimationEnd={handleAnimationEnd}
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
                    ref={contentRef}
                    style={contentStyle}
                    {...contentProps}
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
