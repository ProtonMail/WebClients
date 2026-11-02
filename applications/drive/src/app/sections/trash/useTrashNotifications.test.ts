import { renderHook } from '@testing-library/react';

import { showAggregatedErrorNotification } from '@proton/drive/legacy/errorHandling';

import { useTrashNotifications } from './useTrashNotifications';

jest.mock('@proton/drive/legacy/errorHandling', () => ({
    showAggregatedErrorNotification: jest.fn(),
}));

jest.mock('@proton/drive/modules/notifications', () => ({
    useListNotifications: () => ({ createSuccessMessage: jest.fn() }),
}));

jest.mock('@proton/components/components/confirmActionModal/ConfirmActionModal', () => ({
    useConfirmActionModal: () => [null, jest.fn()],
}));

jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: jest.fn() }),
}));

describe('useTrashNotifications', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('passes the failure errors themselves, so they are reported with their message', () => {
        const error = new Error('Node is locked');
        const { result } = renderHook(() => useTrashNotifications());

        result.current.createTrashedItemsNotifications([], [{ uid: 'uid-1', error }]);

        const [errors, getMessage] = jest.mocked(showAggregatedErrorNotification).mock.calls[0];
        expect(errors).toEqual([error]);
        expect(getMessage(error)).toBe('Node is locked');
    });
});
