import { renderHook } from '@testing-library/react';

import useOnline from '@proton/components/hooks/useOnline';

import { retry } from '../../store/elements/elementsActions';
import { useMailDispatch } from '../../store/hooks';
import { useRetryElementsOnReconnect } from './useRetryElementsOnReconnect';

jest.mock('@proton/components/hooks/useOnline');
const mockUseOnline = useOnline as jest.Mock;

jest.mock('../../store/hooks', () => ({
    useMailDispatch: jest.fn(),
}));
const mockUseMailDispatch = useMailDispatch as jest.Mock;

describe('useRetryElementsOnReconnect', () => {
    let dispatch: jest.Mock;

    beforeEach(() => {
        dispatch = jest.fn();
        mockUseMailDispatch.mockReturnValue(dispatch);
    });

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

    it('dispatches a retry reset once the browser comes back online', () => {
        mockUseOnline.mockReturnValue(true);
        const { rerender } = renderHook(() => useRetryElementsOnReconnect());

        mockUseOnline.mockReturnValue(false);
        rerender();

        mockUseOnline.mockReturnValue(true);
        rerender();

        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenCalledWith(retry({ queryParameters: undefined, error: undefined }));
    });
});
