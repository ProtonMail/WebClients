import type { PropsWithChildren, ReactNode } from 'react';
import { Children, type ReactElement, cloneElement, useCallback, useState } from 'react';

import { useTooltipHandlers } from '@proton/atoms/Tooltip/useTooltipHandlers';
import Popper from '@proton/components/components/popper/Popper';
import usePopper from '@proton/components/components/popper/usePopper';
import useInstance from '@proton/hooks/useInstance';
import useIsMounted from '@proton/hooks/useIsMounted';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';
import isTruthy from '@proton/utils/isTruthy';

import './StorageSplitPopper.scss';

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

interface State {
    open: boolean;
    position: 'first' | 'last' | 'middle';
    closing: boolean;
    animate: boolean;
}

const defaultState: State = { position: 'middle', open: false, closing: false, animate: false };

interface StorageSplitPopperProps {
    tooltip: ReactNode;
}
export function StorageSplitPopper({ children, tooltip, ...rest }: PropsWithChildren<StorageSplitPopperProps>) {
    const uid = useInstance(() => generateUID('popper'));
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
    const { floating, reference, position } = usePopper({
        isOpen,
        originalPlacement: 'top',
        availablePlacements: ['top', 'bottom', 'left', 'right'],
        updateAnimationFrame: true,
    });

    const tooltipHandlers = useTooltipHandlers({
        open,
        close,
        isOpen,
        openDelay: 0,
        closeDelay: 250,
        longTapDelay: 0,
    });

    const child = Children.only(children) as ReactElement;
    const animateInFirst = getAnimateInFirst(state);
    const animateOutLast = getAnimateOutLast(state);
    const animateInMiddle = getAnimateInMiddle(state);
    const animateOutMiddle = getAnimateOutMiddle(state);

    return (
        <>
            {cloneElement(child, {
                ref: reference,
                ...rest,
                ...tooltipHandlers,
                'aria-describedby': [child.props['aria-describedby'], uid].filter(isTruthy).join(' '),
            })}
            <Popper
                id={uid}
                divRef={floating}
                isOpen={isOpen}
                style={{ ...position, scale: '1.001', '--max-w-custom': '16rem' }}
                className={clsx(
                    'storage-split-popper absolute bg-norm color-norm px-4 py-3 rounded border shadow-lifted max-w-custom',
                    animateInMiddle && 'storage-split-popper-in',
                    animateOutMiddle && 'storage-split-popper-out',
                    animateInFirst && 'storage-split-popper-in-first',
                    animateOutLast && 'storage-split-popper-out-last'
                )}
                onAnimationEnd={(event) => {
                    if (event.animationName.includes('anime-storage-split-popper-out-last')) {
                        setState((oldState) => {
                            if (getAnimateOutLast(oldState)) {
                                return defaultState;
                            }
                            return oldState;
                        });
                    }
                    if (event.animationName.includes('anime-storage-split-popper-out')) {
                        setState((oldState) => {
                            if (getAnimateOutMiddle(oldState)) {
                                return defaultState;
                            }
                            return oldState;
                        });
                    }
                    if (event.animationName.includes('anime-storage-split-popper-in')) {
                        setState((oldState) => {
                            if (getAnimateInMiddle(oldState)) {
                                return { open: true, position: 'middle', closing: false, animate: false };
                            }
                            return oldState;
                        });
                    }
                    if (event.animationName.includes('anime-storage-split-popper-in-first')) {
                        setState((oldState) => {
                            if (getAnimateInFirst(oldState)) {
                                return { open: true, position: 'first', closing: false, animate: false };
                            }
                            return oldState;
                        });
                    }
                }}
            >
                {tooltip}
            </Popper>
        </>
    );
}
