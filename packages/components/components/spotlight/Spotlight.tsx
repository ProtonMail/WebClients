import {
    AnimationEvent,
    CSSProperties,
    Children,
    MouseEventHandler,
    PropsWithChildren,
    ReactElement,
    ReactNode,
    RefObject,
    cloneElement,
    useEffect,
    useRef,
    useState,
} from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useCombinedRefs } from '@proton/hooks';
import discoverIllustration from '@proton/styles/assets/img/illustrations/spotlight-binoculars.svg';
import newIllustration from '@proton/styles/assets/img/illustrations/spotlight-stars.svg';
import clsx from '@proton/utils/clsx';

import { generateUID } from '../../helpers';
import { useIsClosing } from '../../hooks';
import { Icon } from '../icon';
import { PopperPlacement, usePopper, usePopperState } from '../popper';
import { shouldShowSideRadius } from '../popper/utils';
import Portal from '../portal/Portal';

type SpotlightType = 'discover' | 'new';

export interface SpotlightProps {
    show: boolean;
    content: ReactNode;
    type?: SpotlightType;
    onDisplayed?: () => void;
    onClose?: MouseEventHandler;
    originalPlacement?: PopperPlacement;
    hasClose?: boolean;
    /**
     * Setting the anchor is optional, it will default on the root child
     */
    anchorRef?: RefObject<HTMLElement>;
    style?: CSSProperties;
    className?: string;
    size?: 'large';
}

const Spotlight = ({
    children,
    show,
    content,
    type,
    onDisplayed,
    onClose,
    originalPlacement = 'top',
    hasClose = true,
    anchorRef: inputAnchorRef,
    style = {},
    className,
    size,
}: PropsWithChildren<SpotlightProps>) => {
    const [uid] = useState(generateUID('spotlight'));

    const popperAnchorRef = useRef<HTMLDivElement>(null);
    const { open, close, isOpen } = usePopperState();
    const anchorRef = inputAnchorRef || popperAnchorRef;
    const { floating, position, arrow, placement } = usePopper({
        // Spotlights open automatically and often targets elements which might have layout shifts,
        // so it's updated more aggressively than dropdowns and tooltips which are user triggered.
        updateAnimationFrame: true,
        reference: {
            mode: 'element',
            value: anchorRef?.current,
        },
        isOpen,
        originalPlacement,
    });
    const showSideRadius = shouldShowSideRadius(arrow['--arrow-offset'], placement, 8);

    const [isClosing, isClosed, setIsClosed] = useIsClosing(isOpen);

    const child = Children.only(children) as ReactElement;
    // Types are wrong? Not sure why ref doesn't exist on a ReactElement
    // @ts-ignore
    const mergedRef = useCombinedRefs(popperAnchorRef, child?.ref);

    useEffect(() => {
        if (show) {
            open();
            onDisplayed?.();
        }
    }, [show]);

    if (isClosed || !show) {
        return cloneElement(child, { ref: mergedRef });
    }

    const handleAnimationEnd = ({ animationName }: AnimationEvent) => {
        if (animationName.includes('anime-spotlight-out') && isClosing) {
            setIsClosed();
        }
    };

    const handleClose: MouseEventHandler = (event) => {
        onClose?.(event);
        close();
    };

    const closeText = c('Action').t`Close`;

    const illustrationURL = type
        ? {
              discover: discoverIllustration as string,
              new: newIllustration as string,
          }[type]
        : null;

    return (
        <>
            {cloneElement(child, {
                ref: mergedRef,
                'aria-describedby': uid,
            })}
            <Portal>
                <div
                    ref={floating}
                    id={uid}
                    style={{ ...position, ...arrow, ...style }}
                    className={clsx([
                        'spotlight',
                        size && `spotlight--${size}`,
                        `spotlight--${placement}`,
                        isClosing && 'is-spotlight-out',
                        type && 'spotlight--with-illustration',
                        !showSideRadius && 'spotlight--no-side-radius',
                        className,
                    ])}
                    onAnimationEnd={handleAnimationEnd}
                >
                    <div className={clsx(['spotlight-inner', type && 'flex flex-nowrap flex-align-items-start'])}>
                        {illustrationURL && <img className="flex-item-noshrink mr-6" src={illustrationURL} alt="" />}
                        <div>{content}</div>
                    </div>

                    {hasClose && (
                        <Button
                            icon
                            shape="ghost"
                            size="small"
                            className="spotlight-close"
                            title={closeText}
                            onClick={handleClose}
                        >
                            <Icon name="cross" alt={closeText} />
                        </Button>
                    )}
                </div>
            </Portal>
        </>
    );
};

export default Spotlight;
