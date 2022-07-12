import { Children, cloneElement, HTMLProps, ReactElement, ReactNode, useContext, useEffect, useState } from 'react';
import useInstance from '@proton/hooks/useInstance';
import isTruthy from '@proton/utils/isTruthy';

import { generateUID, classnames } from '../../helpers';
import { usePopper, Popper, usePopperAnchor } from '../popper';
import useRightToLeft from '../../containers/rightToLeft/useRightToLeft';
import useTooltipHandlers from './useTooltipHandlers';
import { useCombinedRefs } from '../../hooks';
import { TooltipExclusiveContext } from './TooltipExclusive';

export type TooltipType = 'info' | 'error' | 'warning';

interface Props extends Omit<HTMLProps<HTMLElement>, 'title' | 'children'> {
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

const Tooltip = ({
    children,
    title,
    originalPlacement = 'top',
    type = 'info',
    anchorOffset,
    isOpen: isExternalOpen,
    ...rest
}: Props) => {
    const uid = useInstance(() => generateUID('tooltip'));
    const [isRTL] = useRightToLeft();

    const rtlAdjustedPlacement = originalPlacement.includes('right')
        ? originalPlacement.replace('right', 'left')
        : originalPlacement.replace('left', 'right');

    const [popperEl, setPopperEl] = useState<HTMLDivElement | null>(null);
    const { anchorRef, open, close, isOpen } = usePopperAnchor<HTMLSpanElement>();
    const combinedIsOpen = isExternalOpen || isOpen;
    const { position, placement } = usePopper({
        popperEl,
        anchorEl: anchorRef.current,
        isOpen: combinedIsOpen,
        originalPlacement: isRTL ? rtlAdjustedPlacement : originalPlacement,
        anchorOffset,
    });

    const exclusive = useContext(TooltipExclusiveContext) || {};

    const tooltipHandlers = useTooltipHandlers(open, close, combinedIsOpen);

    const child = Children.only(children);
    // Types are wrong? Not sure why ref doesn't exist on a ReactElement
    // @ts-ignore
    const mergedRef = useCombinedRefs(anchorRef, child?.ref);

    useEffect(() => {
        if (combinedIsOpen) {
            exclusive.add?.(uid);
        } else {
            exclusive.remove?.(uid);
        }
    }, [isOpen, isExternalOpen]);

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
                'aria-describedby': [child.props['aria-describedby'], uid].filter(isTruthy).join(' '),
            })}
            <Popper
                divRef={setPopperEl}
                id={uid}
                isOpen={(exclusive.last === uid || !exclusive.last) && !!title && combinedIsOpen}
                style={position}
                className={classnames(['tooltip', `tooltip--${placement}`, getTooltipTypeClass(type)])}
            >
                {title}
            </Popper>
        </>
    );
};

export default Tooltip;
