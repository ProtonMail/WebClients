import { useCallback, useState } from 'react';
import type { Stroke } from '../types';

interface HistoryState {
    strokes: Stroke[];
    redoStack: Stroke[];
}

export const useHistory = (initialStrokes: Stroke[] = []) => {
    const [state, setState] = useState<HistoryState>({
        strokes: initialStrokes,
        redoStack: [],
    });

    const addStroke = useCallback((stroke: Stroke) => {
        setState((prev) => ({
            strokes: [...prev.strokes, stroke],
            redoStack: [], // Clear redo stack when new action is performed
        }));
    }, []);

    const undo = useCallback(() => {
        setState((prev) => {
            if (prev.strokes.length === 0) return prev;

            const newStrokes = prev.strokes.slice(0, -1);
            const removedStroke = prev.strokes[prev.strokes.length - 1];

            return {
                strokes: newStrokes,
                redoStack: [...prev.redoStack, removedStroke],
            };
        });
    }, []);

    const redo = useCallback(() => {
        setState((prev) => {
            if (prev.redoStack.length === 0) return prev;

            const strokeToRestore = prev.redoStack[prev.redoStack.length - 1];
            const newRedoStack = prev.redoStack.slice(0, -1);

            return {
                strokes: [...prev.strokes, strokeToRestore],
                redoStack: newRedoStack,
            };
        });
    }, []);

    const clear = useCallback(() => {
        setState({
            strokes: [],
            redoStack: [],
        });
    }, []);

    const canUndo = state.strokes.length > 0;
    const canRedo = state.redoStack.length > 0;

    return {
        strokes: state.strokes,
        addStroke,
        undo,
        redo,
        clear,
        canUndo,
        canRedo,
    };
};
