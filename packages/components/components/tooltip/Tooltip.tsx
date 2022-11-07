import {
    Children,
    HTMLProps,
    ReactElement,
    ReactNode,
    Ref,
    cloneElement,
    forwardRef,
    useContext,
    useEffect,
} from 'react';

import useInstance from '@proton/hooks/useInstance';
import isTruthy from '@proton/utils/isTruthy';

import { classnames, generateUID } from '../../helpers';
import { useCombinedRefs } from '../../hooks';
import { Popper, PopperPlacement, usePopper, usePopperState } from '../popper';
import { TooltipExclusiveContext } from './TooltipExclusive';
import useTooltipHandlers from './useTooltipHandlers';

export type TooltipType = 'info' | 'error' | 'warning';

interface Props extends Omit<HTMLProps<HTMLElement>, 'title' | 'children'> {
    children: ReactElement;
    title: ReactNode;
    originalPlacement?: PopperPlacement;
    type?: TooltipType;
    anchorOffset?: { x: number; y: number };
    isOpen?: boolean;
    relativeReference?: Parameters<typeof usePopper>[0]['relativeReference'];
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

const TooltipBase = (
    {
        children,
        title,
        originalPlacement = 'top',
        type = 'info',
        anchorOffset,
        isOpen: isExternalOpen,
        relativeReference,
        ...rest
    }: Props,
    ref: Ref<HTMLElement>
) => {
    const uid = useInstance(() => generateUID('tooltip'));

    const { open, close, isOpen } = usePopperState();
    const combinedIsOpen = isExternalOpen || isOpen;
    const { floating, reference, position, arrow, placement } = usePopper({
        isOpen: combinedIsOpen,
        originalPlacement,
        relativeReference,
    });

    const exclusive = useContext(TooltipExclusiveContext) || {};

    const tooltipHandlers = useTooltipHandlers(open, close, combinedIsOpen);

    const child = Children.only(children);
    // Types are wrong? Not sure why ref doesn't exist on a ReactElement
    // @ts-ignore
    const mergedRef = useCombinedRefs(child?.ref, reference, ref);

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
                divRef={floating}
                id={uid}
                isOpen={(exclusive.last === uid || !exclusive.last) && !!title && combinedIsOpen}
                style={{ ...position, ...arrow }}
                className={classnames(['tooltip', `tooltip--${placement}`, getTooltipTypeClass(type)])}
            >
                {title}
            </Popper>
        </>
    );
};

const Tooltip = forwardRef<HTMLElement, Props>(TooltipBase);

export default Tooltip;
