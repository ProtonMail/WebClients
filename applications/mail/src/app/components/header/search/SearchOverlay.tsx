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

import type { HotkeyTuple } from '@proton/components';
import { getCustomSizingClasses, useFocusTrap, useHotkeys, useIsClosing } from '@proton/components';
import { Portal } from '@proton/components/components/portal';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

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
    ...rest
}: Props) => {
    const boundingRect = anchorRef.current?.getBoundingClientRect();

    const rootRef = useRef<HTMLDivElement>(null);

    const contentRef = useRef<HTMLDivElement>(null);

    const anchorRectRef = useRef<DOMRect | undefined>();

    const focusTrapProps = useFocusTrap({ rootRef, active: isOpen && !disableFocusTrap, enableInitialFocus: false });

    const defaultShortcutHandlers: HotkeyTuple = [
        'Escape',
        (e) => {
            e.stopPropagation();
            onClose?.();
        },
    ];

    useHotkeys(rootRef, [defaultShortcutHandlers], {
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

    const [isClosing, isClosed, setIsClosed] = useIsClosing(isOpen);
    const popperClassName = clsx(['overlay', isClosing && `is-dropdown-out`, className, 'no-outline']);

    if (isClosed && !isOpen) {
        return null;
    }

    const varPosition = {
        '--top': boundingRect?.top,
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

    const contentStyle = { '--h-custom': 'auto' };

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
