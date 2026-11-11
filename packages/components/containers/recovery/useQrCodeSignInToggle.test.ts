import type { ChangeEvent } from 'react';

import { act, renderHook, waitFor } from '@testing-library/react';

import { toggleQrCodeSignIn } from '@proton/account/recovery/userSettingsActions';
import { useUserSettings } from '@proton/account/userSettings/hooks';

import { useQrCodeSignInToggle } from './useQrCodeSignInToggle';

const mockDispatch = jest.fn();
const mockCreateNotification = jest.fn();
const mockSendRecoverySettingEnabled = jest.fn();

jest.mock('@proton/redux-shared-store/sharedProvider', () => ({ useDispatch: () => mockDispatch }));
jest.mock('@proton/account/userSettings/hooks', () => ({ useUserSettings: jest.fn() }));
jest.mock('@proton/account/recovery/userSettingsActions', () => ({
    toggleQrCodeSignIn: jest.fn((payload) => payload),
}));
jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: mockCreateNotification }),
}));
jest.mock('./recoverySettingsTelemetry', () => ({
    useRecoverySettingsTelemetry: () => ({ sendRecoverySettingEnabled: mockSendRecoverySettingEnabled }),
}));

const mockUserSettings = (EdmOptOut: number) =>
    jest.mocked(useUserSettings).mockReturnValue([{ Flags: { EdmOptOut } } as any, false, undefined]);

const change = (checked: boolean) => ({ target: { checked } }) as ChangeEvent<HTMLInputElement>;

describe('useQrCodeSignInToggle', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockDispatch.mockResolvedValue(undefined);
    });

    it('is checked unless the user opted out', () => {
        mockUserSettings(0);
        expect(renderHook(() => useQrCodeSignInToggle()).result.current.checked).toBe(true);

        mockUserSettings(1);
        expect(renderHook(() => useQrCodeSignInToggle()).result.current.checked).toBe(false);
    });

    it('enables QR code sign-in and reports it', async () => {
        mockUserSettings(1);
        const { result } = renderHook(() => useQrCodeSignInToggle());

        act(() => result.current.onChange(change(true)));

        await waitFor(() =>
            expect(mockCreateNotification).toHaveBeenCalledWith({ type: 'info', text: 'QR code sign-in enabled' })
        );
        expect(mockDispatch).toHaveBeenCalledWith(toggleQrCodeSignIn({ value: true }));
        expect(mockSendRecoverySettingEnabled).toHaveBeenCalledWith({ setting: 'qr_code_sign_in' });
    });

    it('disables QR code sign-in without reporting it', async () => {
        mockUserSettings(0);
        const { result } = renderHook(() => useQrCodeSignInToggle());

        act(() => result.current.onChange(change(false)));

        await waitFor(() =>
            expect(mockCreateNotification).toHaveBeenCalledWith({ type: 'info', text: 'QR code sign-in disabled' })
        );
        expect(mockDispatch).toHaveBeenCalledWith(toggleQrCodeSignIn({ value: false }));
        expect(mockSendRecoverySettingEnabled).not.toHaveBeenCalled();
    });
});
