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

import { Button } from '@proton/atoms/Button/Button';
import type { PopperPlacement } from '@proton/atoms/Popper/interface';
import { usePopper } from '@proton/atoms/Popper/usePopper';
import { usePopperState } from '@proton/atoms/Popper/usePopperState';
import { shouldShowSideRadius } from '@proton/atoms/Popper/utils';
import { Portal } from '@proton/atoms/Portal/Portal';
import { useCombinedRefs } from '@proton/hooks';
import { IcCross } from '@proton/icons/icons/IcCross';
import discoverIllustration from '@proton/styles/assets/img/illustrations/spotlight-binoculars.svg';
import newIllustration from '@proton/styles/assets/img/illustrations/spotlight-stars.svg';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';

import useIsClosing from '../../hooks/useIsClosing';

type SpotlightType = 'discover' | 'new';

export interface SpotlightProps {
    show: boolean;
    content: ReactNode;
    type?: SpotlightType;
    onDisplayed?: () => void;
    onClose?: MouseEventHandler;
    originalPlacement?: PopperPlacement;
    hasClose?: boolean;
    closeIcon?: ReactElement;
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
    /**
     * In case you want to restrict to some placements
     * It's suggested to have at least 3 placements
     */
    availablePlacements?: PopperPlacement[];
    /**
     * Change the default radius of the spotlight
     * allowed value is `xl`, `lg`, `md`, `sm`
     */
    borderRadius?: 'xl' | 'lg' | 'md' | 'sm';
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
    availablePlacements,
    borderRadius = 'md',
    closeIcon = <IcCross />,
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
        availablePlacements,
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
                        borderRadius === 'md' ? 'rounded' : `rounded-${borderRadius}`,
                        className,
                    ])}
                    onAnimationEnd={handleAnimationEnd}
                >
                    <div
                        className={clsx([
                            'spotlight-inner',
                            type && 'flex flex-nowrap items-start',
                            borderRadius === 'md' ? 'rounded' : `rounded-${borderRadius}`,
                            innerClassName,
                        ])}
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
                            {closeIcon}
                            <span className="sr-only">{closeText}</span>
                        </Button>
                    )}
                </div>
            </Portal>
        </>
    );
};

export default Spotlight;
