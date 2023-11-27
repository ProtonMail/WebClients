import { act } from '@testing-library/react-hooks';

import { useFlag } from '@proton/components/containers/unleash';

import { addToCache, minimalCache } from 'proton-mail/helpers/test/cache';
import { renderHook } from 'proton-mail/helpers/test/render';
import { elementsSliceActions } from 'proton-mail/logic/elements/elementsSlice';
import { store } from 'proton-mail/logic/store';

import useSnooze from './useSnooze';

jest.mock('@proton/components/containers/unleash');

describe('useSnooze', () => {
    const mockedUseFlag = useFlag as jest.Mock;
    beforeEach(async () => {
        mockedUseFlag.mockReturnValue(true);
        minimalCache();
        addToCache('User', { hasPaidMail: false });
    });

    it('canSnooze should be true when in inbox and conversation mode', async () => {
        store.dispatch(elementsSliceActions.updateStateParams({ labelID: '0', conversationMode: true }));

        const { result } = await renderHook(() => useSnooze());
        expect(result.current.canSnooze).toEqual(true);
        expect(result.current.isSnoozeEnabled).toEqual(true);
    });

    it('canSnooze should be false when in inbox and not conversation mode', async () => {
        store.dispatch(elementsSliceActions.updateStateParams({ labelID: '0', conversationMode: false }));

        const { result } = await renderHook(() => useSnooze());
        expect(result.current.canSnooze).toEqual(false);
        expect(result.current.isSnoozeEnabled).toEqual(true);
    });

    it('canUnsnooze should be true when in snooze and conversation mode', async () => {
        store.dispatch(elementsSliceActions.updateStateParams({ labelID: '16', conversationMode: true }));

        const { result } = await renderHook(() => useSnooze());
        expect(result.current.canUnsnooze).toEqual(true);
        expect(result.current.isSnoozeEnabled).toEqual(true);
    });

    it('canUnsnooze should be false when in snooze and not conversation mode', async () => {
        store.dispatch(elementsSliceActions.updateStateParams({ labelID: '16', conversationMode: false }));

        const { result } = await renderHook(() => useSnooze());
        expect(result.current.canUnsnooze).toEqual(false);
        expect(result.current.isSnoozeEnabled).toEqual(true);
    });

    it('isSnoozeEnabled should be false when flag is off', async () => {
        mockedUseFlag.mockReturnValue(false);

        const { result } = await renderHook(() => useSnooze());
        expect(result.current.isSnoozeEnabled).toEqual(false);
    });

    it('should update snooze state after custom click and close', async () => {
        const { result } = await renderHook(() => useSnooze());
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
