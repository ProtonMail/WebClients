import { AnimationEvent, Children, cloneElement, ReactElement, ReactNode, RefObject, useEffect, useState } from 'react';
import { c } from 'ttag';

import useRightToLeft from '../../containers/rightToLeft/useRightToLeft';
import Portal from '../portal/Portal';
import { classnames, generateUID } from '../../helpers';
import { useCombinedRefs, useIsClosing } from '../../hooks';
import { Button } from '../button';
import { Icon } from '../icon';
import { usePopper, usePopperAnchor } from '../popper';
import { shouldShowSideRadius } from '../popper/utils';

interface Props {
    children: ReactElement;
    show: boolean;
    content: ReactNode;
    onDisplayed?: () => void;
    originalPlacement?: string;
    hasClose?: boolean;
    /**
     * Setting the anchor is optionnal, it will default on the root child
     */
    anchorRef?: RefObject<HTMLElement>;
}

const Spotlight = ({
    children,
    show,
    content,
    onDisplayed,
    originalPlacement = 'top',
    hasClose = true,
    anchorRef: inputAnchorRef,
}: Props) => {
    const [uid] = useState(generateUID('spotlight'));

    const [isRTL] = useRightToLeft();
    const rtlAdjustedPlacement = originalPlacement.includes('right')
        ? originalPlacement.replace('right', 'left')
        : originalPlacement.replace('left', 'right');

    const [popperEl, setPopperEl] = useState<HTMLDivElement | null>(null);
    const { anchorRef: popperAnchorRef, open, close, isOpen } = usePopperAnchor<HTMLElement>();
    const anchorRef = inputAnchorRef || popperAnchorRef;
    const { position, placement } = usePopper({
        popperEl,
        anchorEl: anchorRef.current,
        isOpen,
        originalPlacement: isRTL ? rtlAdjustedPlacement : originalPlacement,
    });
    const showSideRadius = shouldShowSideRadius(position, placement, 8);

    const [isClosing, isClosed, setIsClosed] = useIsClosing(isOpen);

    const child = Children.only(children);
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

    const closeText = c('Action').t`Close`;

    return (
        <>
            {cloneElement(child, {
                ref: mergedRef,
                'aria-describedby': uid,
            })}
            <Portal>
                <div
                    ref={setPopperEl}
                    id={uid}
                    style={position}
                    className={classnames([
                        'spotlight',
                        `spotlight--${placement}`,
                        isClosing && 'is-spotlight-out',
                        !showSideRadius && 'spotlight--no-side-radius',
                    ])}
                    onAnimationEnd={handleAnimationEnd}
                >
                    <div className="spotlight-inner">{content}</div>
                    {hasClose ? (
                        <Button
                            icon
                            shape="ghost"
                            size="small"
                            className="spotlight-close"
                            title={closeText}
                            onClick={close}
                        >
                            <Icon name="xmark" alt={closeText} />
                        </Button>
                    ) : null}
                </div>
            </Portal>
        </>
    );
};

export default Spotlight;
