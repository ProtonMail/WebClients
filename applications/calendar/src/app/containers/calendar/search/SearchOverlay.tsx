import type {
    AnimationEvent,
    CSSProperties,
    HTMLAttributes,
    MouseEvent as ReactMouseEvent,
    ReactNode,
    RefObject,
} from 'react';
import { useLayoutEffect, useRef } from 'react';

import { c } from 'ttag';

import useFocusTrap from '@proton/components/components/focus/useFocusTrap';
import { Portal } from '@proton/components/components/portal';
import { getCustomSizingClasses } from '@proton/components/helpers/getCustomSizingClasses';
import useDropdownArrowNavigation from '@proton/components/hooks/useDropdownArrowNavigation';
import type { HotkeyTuple } from '@proton/components/hooks/useHotkeys';
import { useHotkeys } from '@proton/components/hooks/useHotkeys';
import useIsClosing from '@proton/components/hooks/useIsClosing';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { ADVANCED_SEARCH_OVERLAY_OPEN_EVENT } from '../../../components/calendar/interactions/constants';

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
    disableFocusTrap?: boolean;
    isOpen?: boolean;
    sameAnchorWidth?: boolean;
    offset?: number;
    autoClose?: boolean;
    contentProps?: ContentProps;
    disableDefaultArrowNavigation?: boolean;
    updatePositionOnDOMChange?: boolean;
}

const SearchOverlay = ({
    anchorRef,
    children,
    className,
    style,
    onClose = noop,
    onClosed,
    onContextMenu = noop,
    isOpen = false,
    disableFocusTrap = false,
    sameAnchorWidth = false,
    contentProps,
    disableDefaultArrowNavigation = false,
    ...rest
}: Props) => {
    const boundingRect = anchorRef.current?.getBoundingClientRect();

    const rootRef = useRef<HTMLDivElement>(null);

    const contentRef = useRef<HTMLDivElement>(null);

    const anchorRectRef = useRef<DOMRect | undefined>();

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
        document.dispatchEvent(new CustomEvent(ADVANCED_SEARCH_OVERLAY_OPEN_EVENT));
        if (sameAnchorWidth) {
            anchorRectRef.current = anchorRef.current?.getBoundingClientRect();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-E355C4
    }, [isOpen]);

    const [isClosing, isClosed, setIsClosed] = useIsClosing(isOpen);
    const popperClassName = clsx(['overlay', isClosing && `is-dropdown-out`, className, 'no-outline']);

    if (isClosed && !isOpen) {
        return null;
    }

    const varPosition = {
        '--top': boundingRect?.bottom,
        '--left': boundingRect?.left,
    };

    const varSize = {
        '--width': boundingRect?.width,
    };

    const handleAnimationEnd = ({ animationName }: AnimationEvent) => {
        if (animationName.includes('anime-dropdown-out') && isClosing) {
            setIsClosed();
            onClosed?.();
        }
    };

    const rootStyle = {
        ...style,
        ...varPosition,
        ...varSize,
    };

    const contentStyle = { '--height-custom': 'auto' };

    return (
        <Portal>
            <div
                ref={rootRef}
                style={rootStyle}
                role="dialog"
                className={popperClassName}
                onAnimationEnd={handleAnimationEnd}
                onContextMenu={onContextMenu}
                data-testid="overlay-button"
                {...rest}
                {...focusTrapProps}
            >
                {/* Backdrop button, meant to override 'autoClose' option on mobile */}
                <div
                    role="button"
                    tabIndex={0}
                    data-ignore-close="true"
                    className="overlay-backdrop"
                    title={c('Action').t`Close`}
                    onClick={() => onClose()}
                >
                    <span className="sr-only">{c('Action').t`Close`}</span>
                </div>
                <div
                    ref={contentRef}
                    style={contentStyle}
                    {...contentProps}
                    className={clsx(['overlay-content', getCustomSizingClasses(contentStyle), contentProps?.className])}
                >
                    {children}
                </div>
            </div>
        </Portal>
    );
};

export default SearchOverlay;
