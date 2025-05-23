import type { MouseEventHandler, Reducer } from 'react';
import { useCallback, useEffect, useReducer, useRef } from 'react';

import { COMPOSER_MODE } from '@proton/shared/lib/mail/mailSettings';
import debounce from '@proton/utils/debounce';
import throttle from '@proton/utils/throttle';

import useMailModel from 'proton-mail/hooks/useMailModel';

import type { ComposerDimension } from '../../helpers/composerPositioning';
import { computeLeftPosition } from '../../helpers/composerPositioning';

interface Props {
    composerDimension: ComposerDimension;
    isMinimized: boolean;
    isMaximized: boolean;
    composerIndex: number;
    totalComposers: number;
    drawerOffset: number;
}

interface State {
    isDragging: boolean;
    initialCursorPosition: number | null;
    offset: number;
    lastOffset: number;
}

type Action =
    | { type: 'start'; payload: Pick<State, 'isDragging' | 'initialCursorPosition'> }
    | { type: 'stop'; payload: Pick<State, 'isDragging' | 'initialCursorPosition'> }
    | { type: 'move'; payload: Pick<State, 'offset'> }
    | { type: 'reset-offset' };

const moveReducer = (state: State, action: Action) => {
    switch (action.type) {
        case 'start':
        case 'move':
            return { ...state, ...action.payload };
        case 'stop':
            // Add lastOffset based on reducer state because stop callback is executed
            // in event listener and value is not up to date when passed through the action
            return { ...state, lastOffset: state.offset, ...action.payload };
        case 'reset-offset':
            return { ...state, offset: 0 };
        default:
            throw new Error('This action does not exist');
    }
};

const useComposerDrag = ({
    composerDimension,
    drawerOffset,
    isMaximized,
    isMinimized,
    totalComposers,
    composerIndex,
}: Props) => {
    const windowWidth = window.innerWidth - drawerOffset;
    const mailSettings = useMailModel('MailSettings');
    const prevMinimized = useRef(isMinimized);
    const prevMaximized = useRef(isMaximized);
    const composerLeftStyle = computeLeftPosition(composerDimension, composerIndex, totalComposers, windowWidth);

    const [{ isDragging, initialCursorPosition, offset, lastOffset }, dispatch] = useReducer<Reducer<State, Action>>(
        moveReducer,
        {
            isDragging: false,
            initialCursorPosition: null,
            offset: 0,
            lastOffset: 0,
        }
    );

    const handleStartDragging: MouseEventHandler<HTMLElement> = (e) => {
        dispatch({ type: 'start', payload: { isDragging: true, initialCursorPosition: e.clientX } });
    };

    const handleStopDragging = () => {
        dispatch({ type: 'stop', payload: { isDragging: false, initialCursorPosition: null } });
    };

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!initialCursorPosition || !isDragging || (isMaximized && !isMinimized)) {
                return;
            }

            const prevOffset = offset;
            const cursorMoveOffset = e.clientX - initialCursorPosition;
            let finalOffset = prevOffset + cursorMoveOffset;

            const composerLeftCornerPos = composerLeftStyle + finalOffset;
            const composerRightCornerPos = composerLeftCornerPos + composerDimension.width;

            if (composerLeftCornerPos < composerDimension.gutter) {
                finalOffset = -(composerLeftStyle - composerDimension.gutter);
            }
            if (composerRightCornerPos > windowWidth - composerDimension.gutter) {
                const maxOffset = windowWidth - composerDimension.gutter - composerLeftStyle - composerDimension.width;
                finalOffset = maxOffset;
            }

            dispatch({ type: 'move', payload: { offset: finalOffset } });
        },
        [isDragging, initialCursorPosition, isMaximized]
    );

    useEffect(() => {
        const throttledMouseMove = throttle(handleMouseMove, 20);
        const debouncedStopDragging = debounce(handleStopDragging, 50);

        if (isDragging) {
            document.addEventListener('mousemove', throttledMouseMove);
            document.addEventListener('mouseup', debouncedStopDragging);
            document.addEventListener('mouseleave', debouncedStopDragging);
        }

        return () => {
            document.removeEventListener('mousemove', throttledMouseMove);
            document.removeEventListener('mouseup', debouncedStopDragging);
            document.removeEventListener('mouseleave', debouncedStopDragging);
        };
    }, [isDragging]);

    useEffect(() => {
        dispatch({ type: 'reset-offset' });
    }, [composerLeftStyle, totalComposers]);

    useEffect(() => {
        if (mailSettings.ComposerMode === COMPOSER_MODE.MAXIMIZED) {
            dispatch({ type: 'reset-offset' });
        }
    }, [mailSettings.ComposerMode]);

    useEffect(() => {
        if (
            isMinimized === false &&
            isMaximized === true &&
            prevMaximized.current === true &&
            prevMinimized.current === true
        ) {
            dispatch({ type: 'reset-offset' });
        }

        prevMinimized.current = isMinimized;
    }, [isMinimized]);

    useEffect(() => {
        if (
            isMinimized === false &&
            isMaximized === false &&
            prevMaximized.current === true &&
            prevMinimized.current === true
        ) {
            prevMaximized.current = isMaximized;
            return;
        }
        dispatch({ type: 'reset-offset' });
        prevMaximized.current = isMaximized;
    }, [isMaximized]);

    return {
        start: handleStartDragging,
        offset,
        // Add some boundaries in order be sure that we are dragging and not clicking
        isDragging: isDragging === true && (offset > lastOffset + 10 || offset < lastOffset - 10),
    };
};

export default useComposerDrag;
