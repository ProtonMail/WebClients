import {
    AnimationEvent,
    CSSProperties,
    HTMLAttributes,
    MouseEvent as ReactMouseEvent,
    ReactNode,
    RefObject,
    useLayoutEffect,
    useRef,
} from 'react';

import { c } from 'ttag';

import {
    HotkeyTuple,
    classnames,
    getCustomSizingClasses,
    useDropdownArrowNavigation,
    useFocusTrap,
    useHotkeys,
    useIsClosing,
} from '@proton/components';
import { Portal } from '@proton/components/components/portal';
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
    disableDefaultArrowNavigation?: boolean;
    updatePositionOnDOMChange?: boolean;
    UNSTABLE_AUTO_HEIGHT?: boolean;
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
        if (sameAnchorWidth) {
            anchorRectRef.current = anchorRef.current?.getBoundingClientRect();
        }
    }, [isOpen]);

    const [isClosing, isClosed, setIsClosed] = useIsClosing(isOpen);
    const popperClassName = classnames(['overlay', isClosing && `is-dropdown-out`, className, 'no-outline']);

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
                    className={classnames([
                        'overlay-content',
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

export default SearchOverlay;
