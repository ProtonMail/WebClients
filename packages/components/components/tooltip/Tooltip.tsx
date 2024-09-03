import type { HTMLProps, ReactElement, ReactNode, Ref } from 'react';
import { Children, cloneElement, forwardRef, useCallback, useState } from 'react';

import generateUID from '@proton/atoms/generateUID';
import { useCombinedRefs } from '@proton/hooks';
import useInstance from '@proton/hooks/useInstance';
import useIsMounted from '@proton/hooks/useIsMounted';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import type { PopperPlacement } from '../popper';
import { Popper, usePopper } from '../popper';
import useTooltipHandlers from './useTooltipHandlers';

import './Tooltip.scss';

export type TooltipType = 'info' | 'error' | 'warning';

interface Props extends Omit<HTMLProps<HTMLElement>, 'title' | 'children'> {
    children: ReactElement;
    title: ReactNode;
    originalPlacement?: PopperPlacement;
    type?: TooltipType;
    anchorOffset?: { x: number; y: number };
    isOpen?: boolean;
    relativeReference?: Parameters<typeof usePopper>[0]['relativeReference'];
    openDelay?: number;
    closeDelay?: number;
    longTapDelay?: number;
    updateAnimationFrame?: boolean;
    tooltipClassName?: string;
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

interface State {
    open: boolean;
    position: 'first' | 'last' | 'middle';
    closing: boolean;
    animate: boolean;
}

const defaultState: State = { position: 'middle', open: false, closing: false, animate: false };

const getAnimateInFirst = (state: State) => {
    return state.position === 'first' && state.open && !state.closing && state.animate;
};

const getAnimateOutLast = (state: State) => {
    return state.position === 'last' && state.open && state.closing && state.animate;
};

const getAnimateInMiddle = (state: State) => {
    return state.position === 'middle' && state.open && !state.closing && state.animate;
};

const getAnimateOutMiddle = (state: State) => {
    return state.position === 'middle' && state.open && state.closing && state.animate;
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
        openDelay,
        closeDelay,
        longTapDelay,
        updateAnimationFrame,
        tooltipClassName,
        ...rest
    }: Props,
    ref: Ref<HTMLElement>
) => {
    const uid = useInstance(() => generateUID('tooltip'));
    const isMounted = useIsMounted();

    const [state, setState] = useState<State>(defaultState);
    const open = useCallback((immediate?: boolean) => {
        if (!isMounted()) {
            return;
        }
        const first = immediate === false;
        setState({ position: first ? 'first' : 'middle', animate: true, open: true, closing: false });
    }, []);

    const close = useCallback((immediate?: boolean) => {
        if (!isMounted()) {
            return;
        }
        const last = immediate === false;
        setState({ position: last ? 'last' : 'middle', animate: true, open: true, closing: true });
    }, []);

    const isOpen = state.open;
    const { floating, reference, position, arrow, placement } = usePopper({
        isOpen,
        originalPlacement,
        relativeReference,
        updateAnimationFrame,
    });

    const tooltipHandlers = useTooltipHandlers({
        open,
        close,
        isOpen,
        isExternalOpen,
        openDelay,
        closeDelay,
        longTapDelay,
    });

    const child = Children.only(children);
    // Types are wrong? Not sure why ref doesn't exist on a ReactElement
    // @ts-ignore
    const mergedRef = useCombinedRefs(child?.ref, reference, ref);

    if (!title) {
        return cloneElement(child, {
            ref: mergedRef,
            ...rest,
        });
    }

    if (!child) {
        return null;
    }

    const animateInFirst = getAnimateInFirst(state);
    const animateOutLast = getAnimateOutLast(state);
    const animateInMiddle = getAnimateInMiddle(state);
    const animateOutMiddle = getAnimateOutMiddle(state);

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
                isOpen={!!title && isOpen}
                style={{ ...position, ...arrow }}
                onAnimationEnd={(event) => {
                    if (event.animationName.includes('anime-tooltip-out-last')) {
                        setState((oldState) => {
                            if (getAnimateOutLast(oldState)) {
                                return defaultState;
                            }
                            return oldState;
                        });
                    }
                    if (event.animationName.includes('anime-tooltip-out')) {
                        setState((oldState) => {
                            if (getAnimateOutMiddle(oldState)) {
                                return defaultState;
                            }
                            return oldState;
                        });
                    }
                    if (event.animationName.includes('anime-tooltip-in')) {
                        setState((oldState) => {
                            if (getAnimateInMiddle(oldState)) {
                                return { open: true, position: 'middle', closing: false, animate: false };
                            }
                            return oldState;
                        });
                    }
                    if (event.animationName.includes('anime-tooltip-in-first')) {
                        setState((oldState) => {
                            if (getAnimateInFirst(oldState)) {
                                return { open: true, position: 'first', closing: false, animate: false };
                            }
                            return oldState;
                        });
                    }
                }}
                className={clsx([
                    'tooltip',
                    animateInMiddle && 'tooltip-in',
                    animateOutMiddle && 'tooltip-out',
                    animateInFirst && `tooltip-in-first`,
                    animateOutLast && `tooltip-out-last`,
                    `tooltip--${placement}`,
                    getTooltipTypeClass(type),
                    tooltipClassName,
                ])}
            >
                {title}
            </Popper>
        </>
    );
};

const Tooltip = forwardRef<HTMLElement, Props>(TooltipBase);

export default Tooltip;
