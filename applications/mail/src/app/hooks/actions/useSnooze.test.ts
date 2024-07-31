import { act } from '@testing-library/react-hooks';

import { minimalCache } from 'proton-mail/helpers/test/cache';
import { renderHook } from 'proton-mail/helpers/test/render';
import { elementsSliceActions } from 'proton-mail/store/elements/elementsSlice';

import useSnooze from './useSnooze';

jest.mock('@proton/unleash');

describe('useSnooze', () => {
    beforeEach(async () => {
        minimalCache();
    });

    it('canSnooze should be true when in inbox and conversation mode', async () => {
        const { result } = await renderHook({
            useCallback: () => useSnooze(),
            init: (store) => {
                store.dispatch(elementsSliceActions.updateStateParams({ labelID: '0', conversationMode: true }));
            },
        });
        expect(result.current.canSnooze).toEqual(true);
    });

    it('canSnooze should be false when in inbox and not conversation mode', async () => {
        const { result } = await renderHook({
            useCallback: () => useSnooze(),
            init: (store) => {
                store.dispatch(elementsSliceActions.updateStateParams({ labelID: '0', conversationMode: false }));
            },
        });

        expect(result.current.canSnooze).toEqual(false);
    });

    it('canUnsnooze should be true when in snooze and conversation mode', async () => {
        const { result } = await renderHook({
            useCallback: () => useSnooze(),
            init: (store) => {
                store.dispatch(elementsSliceActions.updateStateParams({ labelID: '16', conversationMode: true }));
            },
        });
        expect(result.current.canUnsnooze).toEqual(true);
    });

    it('canUnsnooze should be false when in snooze and not conversation mode', async () => {
        const { result } = await renderHook({
            useCallback: () => useSnooze(),
            init: (store) => {
                store.dispatch(elementsSliceActions.updateStateParams({ labelID: '16', conversationMode: false }));
            },
        });
        expect(result.current.canUnsnooze).toEqual(false);
    });

    it('should update snooze state after custom click and close', async () => {
        const { result } = await renderHook({ useCallback: () => useSnooze() });
        expect(result.current.snoozeState).toEqual('snooze-selection');

        act(() => {
            result.current.handleCustomClick();
        });
        expect(result.current.snoozeState).toEqual('custom-snooze');

        act(() => {
            result.current.handleClose();
        });
        expect(result.current.snoozeState).toEqual('snooze-selection');
    });
});
