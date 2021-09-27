import { MouseEventHandler, Reducer, useCallback, useEffect, useReducer } from 'react';
import { debounce, throttle } from '@proton/shared/lib/helpers/function';
import { COMPOSER_GUTTER, COMPOSER_WIDTH, computeRightPosition } from '../../helpers/composerPositioning';

interface Props {
    windowWidth: number;
    minimized: boolean;
    maximized: boolean;
    isNarrow: boolean;
    totalComposers: number;
    composerIndex: number;
}

interface State {
    isDragging: boolean;
    initialCursorPosition: number | null;
    offset: number;
    lastOffset: number;
}

type Action =
    | { type: 'start'; payload: Pick<State, 'isDragging' | 'initialCursorPosition'> }
    | { type: 'stop'; payload: Pick<State, 'isDragging' | 'initialCursorPosition' | 'lastOffset'> }
    | { type: 'move'; payload: Pick<State, 'offset'> }
    | { type: 'reset-offset'; payload: Pick<State, 'offset'> };

const moveReducer = (state: State, action: Action) => {
    switch (action.type) {
        case 'start':
        case 'stop':
        case 'move':
        case 'reset-offset':
            return { ...state, ...action.payload };
        default:
            throw new Error('This action does not exist');
    }
};

const useComposerDrag = ({ windowWidth, maximized, totalComposers, composerIndex }: Props) => {
    const composerRightStyle = computeRightPosition(composerIndex, totalComposers, windowWidth);
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

    const handleStopDragging = debounce(() => {
        dispatch({ type: 'stop', payload: { isDragging: false, initialCursorPosition: null, lastOffset: offset } });
    }, 50);

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!initialCursorPosition || !isDragging || maximized) {
                return;
            }

            const composerWidth = COMPOSER_WIDTH;

            const prevOffset = offset;
            const cursorMoveOffset = e.clientX - initialCursorPosition;
            let finalOffset = prevOffset + cursorMoveOffset;

            const composerRightCornerPos = windowWidth + finalOffset - composerRightStyle;
            const composerLeftCornerPos = windowWidth + finalOffset - composerRightStyle - composerWidth;

            if (composerLeftCornerPos < COMPOSER_GUTTER) {
                const remainingWidth = windowWidth - composerRightStyle - composerWidth;
                finalOffset = -remainingWidth + COMPOSER_GUTTER;
            }
            if (composerRightCornerPos > windowWidth - COMPOSER_GUTTER) {
                finalOffset = composerRightStyle - COMPOSER_GUTTER;
            }

            dispatch({ type: 'move', payload: { offset: finalOffset } });
        },
        [isDragging, initialCursorPosition, maximized]
    );

    useEffect(() => {
        dispatch({ type: 'reset-offset', payload: { offset: 0 } });
    }, [maximized, composerRightStyle, totalComposers]);

    useEffect(() => {
        const throttledMouseMove = throttle(handleMouseMove, 20);

        if (isDragging) {
            document.addEventListener('mousemove', throttledMouseMove);
            document.addEventListener('mouseup', handleStopDragging);
            document.addEventListener('mouseleave', handleStopDragging);
        }

        return () => {
            document.removeEventListener('mousemove', throttledMouseMove);
            document.removeEventListener('mouseup', handleStopDragging);
            document.removeEventListener('mouseleave', handleStopDragging);
        };
    }, [isDragging]);

    return {
        start: handleStartDragging,
        offset,
        // Add some boundaries in order be sure that we are dragging and not clicking
        isDragging: isDragging === true && (offset > lastOffset + 10 || offset < lastOffset - 10),
    };
};

export default useComposerDrag;
