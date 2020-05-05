import React, { useState } from 'react';
import { generateUID, classnames } from '../../helpers/component';
import { usePopper, Popper, usePopperAnchor } from '../popper';
import useRightToLeft from '../../containers/rightToLeft/useRightToLeft';

interface Props {
    children: React.ReactNode;
    title?: string;
    originalPlacement?: 'top' | 'bottom' | 'left' | 'right';
    scrollContainerClass?: string;
    className?: string;
}

const Tooltip = ({ children, title, originalPlacement = 'top', scrollContainerClass = 'main', className }: Props) => {
    const [uid] = useState(generateUID('tooltip'));

    const { isRTL } = useRightToLeft();
    const rtlAdjustedPlacement = originalPlacement.includes('right')
        ? originalPlacement.replace('right', 'left')
        : originalPlacement.replace('left', 'right');

    const [popperEl, setPopperEl] = useState<HTMLDivElement | null>(null);
    const { anchorRef, open, close, isOpen } = usePopperAnchor<HTMLSpanElement>();
    const { position, placement } = usePopper({
        popperEl,
        anchorEl: anchorRef.current,
        isOpen,
        originalPlacement: isRTL ? rtlAdjustedPlacement : originalPlacement,
        scrollContainerClass
    });

    return (
        <>
            <span
                ref={anchorRef}
                onMouseEnter={open}
                onMouseLeave={close}
                onFocus={open}
                onBlur={close}
                aria-describedby={uid}
                className={className}
            >
                {children}
            </span>
            <Popper
                divRef={setPopperEl}
                id={uid}
                isOpen={!!title && isOpen}
                style={position}
                className={classnames(['tooltip', `tooltip--${placement}`])}
            >
                {title}
            </Popper>
        </>
    );
};

export default Tooltip;
