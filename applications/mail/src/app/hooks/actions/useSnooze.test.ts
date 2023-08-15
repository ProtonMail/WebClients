import * as reactRedux from 'react-redux';

import { act, renderHook } from '@testing-library/react-hooks';

import { useFlag } from '@proton/components/containers';

import useSnooze from './useSnooze';

jest.mock('@proton/components/containers/unleash');

jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux'),
    useSelector: jest.fn(),
}));

jest.mock('@proton/components/hooks', () => ({
    useUser: () => [{ hasPaidMail: false }, jest.fn],
}));

jest.mock('@proton/components/hooks', () => ({
    useEventManager: () => ({ call: jest.fn(), stop: jest.fn(), start: jest.fn() }),
    useNotifications: () => ({ createNotification: jest.fn() }),
    useApi: () => jest.fn(),
}));

jest.mock('../optimistic/useOptimisticApplyLabels', () => ({
    useOptimisticApplyLabels: () => jest.fn(),
}));

jest.mock('../../logic/store', () => ({
    useAppDispatch: () => jest.fn(),
}));

describe('useSnooze', () => {
    const useSelectorMock = reactRedux.useSelector as jest.Mock;
    const mockedUseFlag = useFlag as jest.Mock;
    beforeEach(() => {
        useSelectorMock.mockReturnValue({ labelID: '0', conversationMode: true });
        mockedUseFlag.mockReturnValue(true);
    });

    afterEach(() => {
        useSelectorMock.mockClear();
    });

    it('canSnooze should be true when in inbox and conversation mode', () => {
        useSelectorMock.mockReturnValue({ labelID: '0', conversationMode: true });

        const { result } = renderHook(() => useSnooze());
        expect(result.current.canSnooze).toEqual(true);
        expect(result.current.isSnoozeEnabled).toEqual(true);
    });

    it('canSnooze should be false when in inbox and not conversation mode', () => {
        useSelectorMock.mockReturnValue({ labelID: '0', conversationMode: false });

        const { result } = renderHook(() => useSnooze());
        expect(result.current.canSnooze).toEqual(false);
        expect(result.current.isSnoozeEnabled).toEqual(true);
    });

    it('canUnsnooze should be true when in snooze and conversation mode', () => {
        useSelectorMock.mockReturnValue({ labelID: '16', conversationMode: true });

        const { result } = renderHook(() => useSnooze());
        expect(result.current.canUnsnooze).toEqual(true);
        expect(result.current.isSnoozeEnabled).toEqual(true);
    });

    it('canUnsnooze should be false when in snooze and not conversation mode', () => {
        useSelectorMock.mockReturnValue({ labelID: '16', conversationMode: false });

        const { result } = renderHook(() => useSnooze());
        expect(result.current.canUnsnooze).toEqual(false);
        expect(result.current.isSnoozeEnabled).toEqual(true);
    });

    it('isSnoozeEnabled should be false when flag is off', () => {
        mockedUseFlag.mockReturnValue(false);

        const { result } = renderHook(() => useSnooze());
        expect(result.current.isSnoozeEnabled).toEqual(false);
    });

    it('should update snooze state after custom click and close', () => {
        const { result } = renderHook(() => useSnooze());
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
