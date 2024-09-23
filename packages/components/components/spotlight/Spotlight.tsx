import type {
    AnimationEvent,
    CSSProperties,
    MouseEventHandler,
    PropsWithChildren,
    ReactElement,
    ReactNode,
    RefObject,
} from 'react';
import { Children, cloneElement, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import type { PopperPlacement } from '@proton/components/components/popper/interface';
import usePopper from '@proton/components/components/popper/usePopper';
import usePopperState from '@proton/components/components/popper/usePopperState';
import { shouldShowSideRadius } from '@proton/components/components/popper/utils';
import { useCombinedRefs } from '@proton/hooks';
import discoverIllustration from '@proton/styles/assets/img/illustrations/spotlight-binoculars.svg';
import newIllustration from '@proton/styles/assets/img/illustrations/spotlight-stars.svg';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';

import { useIsClosing } from '../../hooks';
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
    innerClassName?: string;
    size?: 'large';
    footer?: ReactNode;
    isAboveModal?: boolean;
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
    innerClassName,
    size,
    footer,
    isAboveModal,
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
                        isAboveModal && 'spotlight--is-above-modal',
                        `spotlight--${placement}`,
                        isClosing && 'is-spotlight-out',
                        type && 'spotlight--with-illustration',
                        !showSideRadius && 'spotlight--no-side-radius',
                        className,
                    ])}
                    onAnimationEnd={handleAnimationEnd}
                >
                    <div
                        className={clsx(['spotlight-inner', type && 'flex flex-nowrap items-start', innerClassName])}
                        data-testid="spotlight-inner"
                    >
                        {illustrationURL && <img className="shrink-0 mr-6" src={illustrationURL} alt="" />}
                        <div>{content}</div>
                    </div>
                    {footer ? (
                        <div className="spotlight-footer" data-testid="spotlight-footer">
                            {footer}
                        </div>
                    ) : null}

                    {hasClose && (
                        <Button
                            icon
                            shape="ghost"
                            size="small"
                            className="spotlight-close"
                            data-testid="spotlight-inner-close-button"
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
