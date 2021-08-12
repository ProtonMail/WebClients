import { useState } from 'react';
import * as React from 'react';
import { generateUID, classnames } from '../../helpers';
import { usePopper, Popper, usePopperAnchor } from '../popper';
import useRightToLeft from '../../containers/rightToLeft/useRightToLeft';
import useTooltipHandlers from './useTooltipHandlers';
import { useCombinedRefs } from '../../hooks';

type TooltipType = 'info' | 'error' | 'warning';

interface Props {
    children: React.ReactElement;
    title?: React.ReactNode;
    originalPlacement?: 'top' | 'bottom' | 'left' | 'right';
    type?: TooltipType;
}

const getTooltipTypeClass = (type: TooltipType) => {
    if (type === 'error') {
        return 'tooltip-danger';
    }
    if (type === 'warning') {
        return 'tooltip-warning';
    }
};

const mergeCallbacks = (a: any, b: any) => {
    return Object.fromEntries(
        Object.entries(a).map(([key, cb]: [string, any]) => {
            const otherCb = b[key];
            return [
                key,
                otherCb
                    ? (...args: any[]) => {
                          cb(...args);
                          otherCb(...args);
                      }
                    : cb,
            ];
        })
    );
};

const Tooltip = ({ children, title, originalPlacement = 'top', type = 'info', ...rest }: Props) => {
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

    const child = React.Children.only(children);
    // Types are wrong? Not sure why ref doesn't exist on a ReactElement
    // @ts-ignore
    const mergedRef = useCombinedRefs(anchorRef, child?.ref);

    if (!title) {
        return React.cloneElement(child, {
            ref: mergedRef,
            ...rest,
        });
    }

    if (!child) {
        return null;
    }

    return (
        <>
            {React.cloneElement(child, {
                ref: mergedRef,
                ...rest,
                ...mergeCallbacks(tooltipHandlers, child.props),
                'aria-describedby': uid,
            })}
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
