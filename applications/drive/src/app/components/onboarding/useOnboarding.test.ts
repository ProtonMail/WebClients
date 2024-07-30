import { act, renderHook } from '@testing-library/react-hooks';

import { queryListPendingExternalInvitations } from '@proton/shared/lib/api/drive/invitation';
import type { ListDrivePendingExternalInvitationsPayload } from '@proton/shared/lib/interfaces/drive/sharing';

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
jest.mock('@proton/shared/lib/api/drive/invitation');

describe('useOnboarding', () => {
    let checklistMock: { isLoading: boolean };
    let queryListPendingExternalInvitationsMock: ListDrivePendingExternalInvitationsPayload;

    beforeEach(() => {
        checklistMock = { isLoading: false };
        queryListPendingExternalInvitationsMock = {
            ExternalInvitations: [
                {
                    VolumeID: 'volumeId',
                    ShareID: 'shareId',
                    ExternalInvitationID: 'externalInvitationId',
                },
            ],
            More: false,
            AnchorID: null,
        };

        mockedUseCheckList.mockReturnValue(checklistMock as ReturnType<typeof mockedUseCheckList>);
        mockedDebouncedRequest.mockResolvedValue(queryListPendingExternalInvitationsMock);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should initialize with default values and fetch pending invitations', async () => {
        const { result, waitFor } = renderHook(() => useOnboarding());

        expect(result.current.isLoading).toBe(true);
        expect(result.current.checklist).toBe(checklistMock);
        expect(result.current.hasPendingExternalInvitations).toBe(false);
        await act(async () => {
            await waitFor(() =>
                expect(mockedDebouncedRequest).toHaveBeenCalledWith(queryListPendingExternalInvitations())
            );
            expect(result.current.hasPendingExternalInvitations).toBe(true);
            expect(result.current.isLoading).toBe(false);
        });
    });
});
