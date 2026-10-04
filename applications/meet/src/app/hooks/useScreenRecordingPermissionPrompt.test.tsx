import { renderHook, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { showPermissionsModal } from '@proton/meet/store/slices/deviceManagementSlice';
import { PermissionsModalType } from '@proton/meet/store/slices/deviceManagementSlice/types';
import { getItem } from '@proton/shared/lib/helpers/storage';

import { useScreenRecordingPermissionPrompt } from './useScreenRecordingPermissionPrompt';

vi.mock('@proton/meet/store/hooks', () => ({ useMeetDispatch: vi.fn(), useMeetSelector: vi.fn() }));
vi.mock('@proton/shared/lib/helpers/desktop', () => ({ isElectronMeet: true }));
vi.mock('@proton/shared/lib/helpers/storage', () => ({ getItem: vi.fn(), setItem: vi.fn() }));

const useMeetDispatchMock = useMeetDispatch as unknown as Mock;
const useMeetSelectorMock = useMeetSelector as unknown as Mock;
const getItemMock = getItem as unknown as Mock;

describe('useScreenRecordingPermissionPrompt', () => {
    const dispatch = vi.fn();

    beforeEach(() => {
        dispatch.mockReset();
        useMeetDispatchMock.mockReturnValue(dispatch);
        useMeetSelectorMock.mockReturnValue({ permissionsModal: PermissionsModalType.NONE });
        getItemMock.mockReturnValue(undefined);
    });

    afterEach(() => {
        delete window.ipcMeetMessageBroker;
    });

    const mockAccess = (access: 'granted' | 'not-requested' | 'denied') => {
        const getScreenCaptureAccess = vi.fn().mockResolvedValue(access);
        window.ipcMeetMessageBroker = { getScreenCaptureAccess };
        return getScreenCaptureAccess;
    };

    it('shows the modal when macOS has not asked yet', async () => {
        mockAccess('not-requested');
        renderHook(() => useScreenRecordingPermissionPrompt());

        await waitFor(() =>
            expect(dispatch).toHaveBeenCalledWith(
                showPermissionsModal({ modal: PermissionsModalType.SCREEN_RECORDING_PERMISSION_MODAL })
            )
        );
    });

    it.each(['granted', 'denied'] as const)('does nothing when access is %s', async (access) => {
        const getScreenCaptureAccess = mockAccess(access);
        renderHook(() => useScreenRecordingPermissionPrompt());

        await waitFor(() => expect(getScreenCaptureAccess).toHaveBeenCalled());
        expect(dispatch).not.toHaveBeenCalled();
    });

    it('waits for other permission modals to close', () => {
        const getScreenCaptureAccess = mockAccess('not-requested');
        useMeetSelectorMock.mockReturnValue({ permissionsModal: PermissionsModalType.PERMISSIONS_MODAL });
        renderHook(() => useScreenRecordingPermissionPrompt());

        expect(getScreenCaptureAccess).not.toHaveBeenCalled();
    });

    it('does nothing once dismissed', () => {
        const getScreenCaptureAccess = mockAccess('not-requested');
        getItemMock.mockReturnValue('true');
        renderHook(() => useScreenRecordingPermissionPrompt());

        expect(getScreenCaptureAccess).not.toHaveBeenCalled();
    });

    it('does nothing on desktop builds without screen capture access', () => {
        window.ipcMeetMessageBroker = { send: vi.fn() };
        renderHook(() => useScreenRecordingPermissionPrompt());

        expect(dispatch).not.toHaveBeenCalled();
    });
});
