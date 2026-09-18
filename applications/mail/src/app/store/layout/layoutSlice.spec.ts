import { layoutActions, layoutReducer, layoutInitialState } from './layoutSlice';

describe('layout slice', () => {
    const getState = () => layoutReducer.layout(layoutInitialState, layoutActions.setDraggingElements(true));

    it('tracks dragging count', () => {
        const state = layoutReducer.layout(layoutInitialState, layoutActions.setDraggingElementsCount(1));
        expect(state.draggingElementsCount).toEqual(1);
        expect(state.draggingElements).toEqual(false);
    });

    it('stores the dragged message ID only for single-message drags', () => {
        const state = layoutReducer.layout(layoutInitialState, layoutActions.setDraggedMessageID('message-123'));
        expect(state.draggedMessageID).toEqual('message-123');
    });

    it('defaults to no dragged message ID and zero count', () => {
        expect(layoutInitialState.draggingElementsCount).toEqual(0);
        expect(layoutInitialState.draggedMessageID).toBeNull();
    });

    it('still exposes the boolean draggingElements flag', () => {
        const state = getState();
        expect(state.draggingElements).toEqual(true);
    });
});
