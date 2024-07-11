import { act, renderHook } from '@testing-library/react-hooks';

import { queryOnboarding } from '@proton/shared/lib/api/drive/onboarding';

import useChecklist from './useChecklist';
import { useOnboarding } from './useOnboarding';

jest.mock('./useChecklist');
const mockedUseCheckList = jest.mocked(useChecklist);
const mockedDebouncedRequest = jest.fn();
jest.mock('../../store/_api/useDebouncedRequest', () => {
    const useDebouncedRequest = () => {
        return mockedDebouncedRequest;
    };
    return useDebouncedRequest;
});
jest.mock('@proton/shared/lib/api/drive/onboarding');

describe('useOnboarding', () => {
    let checklistMock: { isLoading: boolean };
    let queryOnboardingMock: { HasPendingInvitations: boolean };

    beforeEach(() => {
        checklistMock = { isLoading: false };
        queryOnboardingMock = { HasPendingInvitations: true };

        mockedUseCheckList.mockReturnValue(checklistMock as ReturnType<typeof mockedUseCheckList>);
        mockedDebouncedRequest.mockResolvedValue(queryOnboardingMock);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should initialize with default values and fetch pending invitations', async () => {
        const { result, waitFor } = renderHook(() => useOnboarding());

        expect(result.current.isLoading).toBe(true);
        expect(result.current.checklist).toBe(checklistMock);
        expect(result.current.hasPendingInvitations).toBe(false);
        await act(async () => {
            await waitFor(() => expect(mockedDebouncedRequest).toHaveBeenCalledWith(queryOnboarding()));
            expect(result.current.hasPendingInvitations).toBe(true);
            expect(result.current.isLoading).toBe(false);
        });
    });
});
