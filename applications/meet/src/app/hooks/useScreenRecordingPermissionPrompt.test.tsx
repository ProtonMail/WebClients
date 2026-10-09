import { renderHook, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { showPermissionsModal } from '@proton/meet/store/slices/deviceManagementSlice';
import { selectPermissionsModals } from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import { PermissionsModalType } from '@proton/meet/store/slices/deviceManagementSlice/types';
import { selectIsGuest, selectUserId } from '@proton/meet/store/slices/userSlice';
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
    let permissionsModal: PermissionsModalType;
    let storage: Record<string, string>;

    beforeEach(() => {
        dispatch.mockReset();
        useMeetDispatchMock.mockReturnValue(dispatch);
        permissionsModal = PermissionsModalType.NONE;
        storage = {};
        useMeetSelectorMock.mockImplementation((selector) => {
            if (selector === selectPermissionsModals) {
                return { permissionsModal };
            }
            if (selector === selectIsGuest) {
                return false;
            }
            if (selector === selectUserId) {
                return 'user-1';
            }
        });
        getItemMock.mockImplementation((key: string) => storage[key]);
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
        permissionsModal = PermissionsModalType.PERMISSIONS_MODAL;
        renderHook(() => useScreenRecordingPermissionPrompt());

        expect(getScreenCaptureAccess).not.toHaveBeenCalled();
    });

    it('does nothing once dismissed', () => {
        const getScreenCaptureAccess = mockAccess('not-requested');
        storage['screenRecordingPromptDismissed.user.user-1'] = 'true';
        renderHook(() => useScreenRecordingPermissionPrompt());

        expect(getScreenCaptureAccess).not.toHaveBeenCalled();
    });

    it('still asks when only another account dismissed it', async () => {
        mockAccess('not-requested');
        storage['screenRecordingPromptDismissed.user.someone-else'] = 'true';
        renderHook(() => useScreenRecordingPermissionPrompt());

        await waitFor(() =>
            expect(dispatch).toHaveBeenCalledWith(
                showPermissionsModal({ modal: PermissionsModalType.SCREEN_RECORDING_PERMISSION_MODAL })
            )
        );
    });

    it('does nothing on desktop builds without screen capture access', () => {
        window.ipcMeetMessageBroker = { send: vi.fn() };
        renderHook(() => useScreenRecordingPermissionPrompt());

        expect(dispatch).not.toHaveBeenCalled();
    });
});
