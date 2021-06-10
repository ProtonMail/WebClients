import React, { useEffect, useState, useRef, CSSProperties, useLayoutEffect } from 'react';
import { c } from 'ttag';
import { noop } from 'proton-shared/lib/helpers/function';
import { classnames } from '../../helpers';
import useRightToLeft from '../../containers/rightToLeft/useRightToLeft';
import { usePopper } from '../popper';
import { ALL_PLACEMENTS, Position } from '../popper/utils';
import Portal from '../portal/Portal';
import { useCombinedRefs, useHotkeys, useDropdownArrowNavigation, HotkeyTuple } from '../../hooks';
import { useFocusTrap } from '../focus';
import useIsClosing from './useIsClosing';

interface ContentProps extends React.HTMLAttributes<HTMLDivElement> {
    ref?: React.RefObject<HTMLDivElement>;
}

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    anchorRef: React.RefObject<HTMLElement>;
    children: React.ReactNode;
    className?: string;
    style?: CSSProperties;
    onClose?: (event?: React.MouseEvent<HTMLDivElement> | Event) => void;
    onClosed?: () => void;
    onContextMenu?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
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
    preventArrowKeyNavigationAutofocus?: boolean;
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
    preventArrowKeyNavigationAutofocus = false,
    UNSTABLE_AUTO_HEIGHT,
    ...rest
}: Props) => {
    const { isRTL } = useRightToLeft();
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
    });

    const handleClickContent = (event: React.MouseEvent<HTMLDivElement>) => {
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
        isOpen,
        disabled: disableDefaultArrowNavigation,
        preventArrowKeyNavigationAutofocus,
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
        dependencies: [isOpen],
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
            const targetNode = target as Node;
            const anchorEl = anchorRef.current;
            // Do nothing if clicking ref's element or descendent elements
            if (
                !autoCloseOutside ||
                (autoCloseOutsideAnchor && anchorEl?.contains(targetNode)) ||
                popperEl?.contains(targetNode)
            ) {
                return;
            }
            onClose();
        };

        document.addEventListener('dropdownclose', onClose);
        document.addEventListener('click', handleClickOutside);

        return () => {
            document.removeEventListener('dropdownclose', onClose);
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isOpen, autoCloseOutside, onClose, anchorRef.current, popperEl]);

    const [isClosing, isClosed, setIsClosed] = useIsClosing(isOpen);
    const popperClassName = classnames([
        'dropdown',
        noMaxSize && 'dropdown--no-max-size',
        `dropdown--${placement}`,
        isClosing && `is-dropdown-out`,
        noCaret && 'dropdown--no-caret',
        className,
        'no-outline',
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

    const handleAnimationEnd = ({ animationName }: React.AnimationEvent) => {
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

    const contentStyle = UNSTABLE_AUTO_HEIGHT ? { height: 'auto' } : undefined;

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
                    className={classnames(['dropdown-content', contentProps?.className])}
                >
                    {children}
                </div>
            </div>
        </Portal>
    );
};

export default Dropdown;
