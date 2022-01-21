import { Children, cloneElement, ReactElement, ReactNode, useState } from 'react';
import { generateUID, classnames } from '../../helpers';
import { usePopper, Popper, usePopperAnchor } from '../popper';
import useRightToLeft from '../../containers/rightToLeft/useRightToLeft';
import useTooltipHandlers from './useTooltipHandlers';
import { useCombinedRefs } from '../../hooks';

export type TooltipType = 'info' | 'error' | 'warning';

interface Props {
    children: ReactElement;
    title?: ReactNode;
    originalPlacement?: 'top' | 'bottom' | 'left' | 'right';
    type?: TooltipType;
    anchorOffset?: { x: number; y: number };
    isOpen?: boolean;
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

const Tooltip = ({ children, title, originalPlacement = 'top', type = 'info', anchorOffset, ...rest }: Props) => {
    const [uid] = useState(generateUID('tooltip'));

    const [isRTL] = useRightToLeft();

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
        anchorOffset,
    });

    const tooltipHandlers = useTooltipHandlers(open, close, isOpen);

    const child = Children.only(children);
    // Types are wrong? Not sure why ref doesn't exist on a ReactElement
    // @ts-ignore
    const mergedRef = useCombinedRefs(anchorRef, child?.ref);

    if (!title) {
        return cloneElement(child, {
            ref: mergedRef,
            ...rest,
        });
    }

    if (!child) {
        return null;
    }

    return (
        <>
            {cloneElement(child, {
                ref: mergedRef,
                ...rest,
                ...mergeCallbacks(tooltipHandlers, child.props),
                'aria-describedby': uid,
            })}
            <Popper
                divRef={setPopperEl}
                id={uid}
                isOpen={!!title && (rest.isOpen || isOpen)}
                style={position}
                className={classnames(['tooltip', `tooltip--${placement}`, getTooltipTypeClass(type)])}
            >
                {title}
            </Popper>
        </>
    );
};

export default Tooltip;
