import { renderHook } from '@testing-library/react';

import useOnline from '@proton/components/hooks/useOnline';
import { useFlag } from '@proton/unleash/useFlag';

import { MAX_ELEMENT_LIST_LOAD_RETRIES } from '../../constants';
import { retry } from '../../store/elements/elementsActions';
import { selectPendingRequest, selectRetry } from '../../store/elements/elementsSelectors';
import { useMailDispatch, useMailSelector } from '../../store/hooks';
import { useRetryElementsOnReconnect } from './useRetryElementsOnReconnect';

jest.mock('@proton/components/hooks/useOnline');
const mockUseOnline = useOnline as jest.Mock;

jest.mock('@proton/unleash/useFlag');
const mockUseFlag = useFlag as jest.Mock;

jest.mock('../../store/hooks', () => ({
    useMailDispatch: jest.fn(),
    useMailSelector: jest.fn(),
}));
const mockUseMailDispatch = useMailDispatch as jest.Mock;
const mockUseMailSelector = useMailSelector as jest.Mock;

describe('useRetryElementsOnReconnect', () => {
    let dispatch: jest.Mock;
    let pendingRequest: boolean;
    let retryCount: number;

    beforeEach(() => {
        dispatch = jest.fn();
        mockUseMailDispatch.mockReturnValue(dispatch);
        mockUseFlag.mockReturnValue(false);
        pendingRequest = false;
        retryCount = MAX_ELEMENT_LIST_LOAD_RETRIES;
        mockUseMailSelector.mockImplementation((selector) => {
            if (selector === selectPendingRequest) {
                return pendingRequest;
            }
            if (selector === selectRetry) {
                return { payload: undefined, count: retryCount, error: undefined };
            }
            throw new Error('Unexpected selector');
        });
    });

    const goOfflineThenOnline = (rerender: () => void) => {
        mockUseOnline.mockReturnValue(false);
        rerender();
        mockUseOnline.mockReturnValue(true);
        rerender();
    };

    it('does not dispatch on mount, even when already online', () => {
        mockUseOnline.mockReturnValue(true);
        renderHook(() => useRetryElementsOnReconnect());

        expect(dispatch).not.toHaveBeenCalled();
    });

    it('does not dispatch when going offline', () => {
        mockUseOnline.mockReturnValue(true);
        const { rerender } = renderHook(() => useRetryElementsOnReconnect());

        mockUseOnline.mockReturnValue(false);
        rerender();

        expect(dispatch).not.toHaveBeenCalled();
    });

    it('dispatches a retry reset once back online, with the retry budget exhausted and nothing pending', () => {
        mockUseOnline.mockReturnValue(true);
        const { rerender } = renderHook(() => useRetryElementsOnReconnect());

        goOfflineThenOnline(rerender);

        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenCalledWith(retry({ error: undefined }));
    });

    it('does not dispatch a duplicate on a StrictMode-style re-invocation of the same transition', () => {
        mockUseOnline.mockReturnValue(true);
        const { rerender } = renderHook(() => useRetryElementsOnReconnect());

        goOfflineThenOnline(rerender);
        expect(dispatch).toHaveBeenCalledTimes(1);

        // A re-render with the same (already-online) value must not fire again.
        rerender();
        expect(dispatch).toHaveBeenCalledTimes(1);
    });

    it('does not dispatch when a request is still in flight', () => {
        pendingRequest = true;
        mockUseOnline.mockReturnValue(true);
        const { rerender } = renderHook(() => useRetryElementsOnReconnect());

        goOfflineThenOnline(rerender);

        expect(dispatch).not.toHaveBeenCalled();
    });

    it('does not dispatch when the retry budget is not exhausted', () => {
        retryCount = MAX_ELEMENT_LIST_LOAD_RETRIES - 1;
        mockUseOnline.mockReturnValue(true);
        const { rerender } = renderHook(() => useRetryElementsOnReconnect());

        goOfflineThenOnline(rerender);

        expect(dispatch).not.toHaveBeenCalled();
    });

    it('does not dispatch when the killswitch is enabled', () => {
        mockUseFlag.mockReturnValue(true);
        mockUseOnline.mockReturnValue(true);
        const { rerender } = renderHook(() => useRetryElementsOnReconnect());

        goOfflineThenOnline(rerender);

        expect(dispatch).not.toHaveBeenCalled();
    });
});
