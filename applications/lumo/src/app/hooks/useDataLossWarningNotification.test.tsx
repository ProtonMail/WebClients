import { renderHook } from '@testing-library/react';

import { useLumoDispatch, useLumoSelector } from '../redux/hooks';
import { dismissDataLossWarning } from '../redux/slices/meta/errors';
import { acknowledgeLumoDataLossWarning } from '../redux/slices/meta/initialization';
import { useDataLossWarningNotification } from './useDataLossWarningNotification';

jest.mock('../redux/hooks', () => ({
    useLumoDispatch: jest.fn(),
    useLumoSelector: jest.fn(),
}));

const createNotification = jest.fn();
jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification }),
}));

const mockedUseLumoDispatch = useLumoDispatch as jest.Mock;
const mockedUseLumoSelector = useLumoSelector as jest.Mock;

describe('useDataLossWarningNotification', () => {
    const dispatch = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockedUseLumoDispatch.mockReturnValue(dispatch);
    });

    it('shows the toast and records that the recovery warning was shown', () => {
        mockedUseLumoSelector.mockImplementation((selector) =>
            selector({ errors: { dataLossWarnings: [{ id: 'warning-1', timestamp: 1 }] } })
        );

        renderHook(() => useDataLossWarningNotification());

        expect(createNotification).toHaveBeenCalledTimes(1);
        expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'warning' }));

        expect(dispatch).toHaveBeenCalledWith(dismissDataLossWarning('warning-1'));
        expect(dispatch).toHaveBeenCalledWith(acknowledgeLumoDataLossWarning());
    });

    it('does nothing when there are no warnings', () => {
        mockedUseLumoSelector.mockImplementation((selector) => selector({ errors: { dataLossWarnings: [] } }));

        renderHook(() => useDataLossWarningNotification());

        expect(createNotification).not.toHaveBeenCalled();
        expect(dispatch).not.toHaveBeenCalled();
    });

    it('does not re-show or re-dispatch for a warning already handled', () => {
        mockedUseLumoSelector.mockImplementation((selector) =>
            selector({ errors: { dataLossWarnings: [{ id: 'warning-1', timestamp: 1 }] } })
        );

        const { rerender } = renderHook(() => useDataLossWarningNotification());
        rerender();

        expect(createNotification).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenCalledTimes(2);
    });
});
