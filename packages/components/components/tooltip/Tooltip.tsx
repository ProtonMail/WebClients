import React, { useState } from 'react';
import { generateUID, classnames } from '../../helpers';
import { usePopper, Popper, usePopperAnchor } from '../popper';
import useRightToLeft from '../../containers/rightToLeft/useRightToLeft';
import useTooltipHandlers from './useTooltipHandlers';

type TooltipType = 'info' | 'error' | 'warning';

interface Props {
    children: React.ReactNode;
    title?: string;
    originalPlacement?: 'top' | 'bottom' | 'left' | 'right';
    className?: string;
    type?: TooltipType;
}

const getTooltipTypeClass = (type: TooltipType) => {
    if (type === 'error') {
        return 'tooltip--warning';
    }
    if (type === 'warning') {
        return 'tooltip--attention';
    }
};

const Tooltip = ({ children, title, originalPlacement = 'top', className, type = 'info' }: Props) => {
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
    });
    const tooltipHandlers = useTooltipHandlers(open, close, isOpen);

    return (
        <>
            <span ref={anchorRef} {...tooltipHandlers} aria-describedby={uid} className={className}>
                {children}
            </span>
            <Popper
                divRef={setPopperEl}
                id={uid}
                isOpen={!!title && isOpen}
                style={position}
                className={classnames(['tooltip', `tooltip--${placement}`, getTooltipTypeClass(type)])}
            >
                {title}
            </Popper>
        </>
    );
};

export default Tooltip;
