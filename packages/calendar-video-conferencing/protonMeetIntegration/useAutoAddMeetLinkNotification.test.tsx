import { act, renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useHasMeetProductAccess } from '@proton/account/organization/useHasMeetProductAccess';
import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import { useCalendarUserSettings } from '@proton/calendar/calendarUserSettings/hooks';
import useEventManager from '@proton/components/hooks/useEventManager';
import { AutoAddVideoConferenceLinkProvider } from '@proton/shared/lib/calendar/constants';

import { useAutoAddMeetLinkNotification } from './useAutoAddMeetLinkNotification';

vi.mock('@proton/components/hooks/useEventManager', () => ({
    default: vi.fn(),
}));

vi.mock('@proton/app-context/useApi', () => ({
    useApi: vi.fn(),
}));

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: vi.fn(),
}));

vi.mock('@proton/account/organization/useHasMeetProductAccess', () => ({
    useHasMeetProductAccess: vi.fn(),
}));

vi.mock('@proton/calendar/calendarUserSettings/hooks', () => ({
    useCalendarUserSettings: vi.fn(),
}));

describe('useAutoAddMeetLinkNotification', () => {
    const mockApi = vi.fn();
    const mockCall = vi.fn();
    const mockCreateNotification = vi.fn();
    const mockHideNotification = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        (useApi as Mock).mockReturnValue(mockApi);
        (useEventManager as Mock).mockReturnValue({ call: mockCall });
        (useNotifications as Mock).mockReturnValue({
            createNotification: mockCreateNotification,
            hideNotification: mockHideNotification,
        });
        (useHasMeetProductAccess as Mock).mockReturnValue(true);

        mockApi.mockResolvedValue({});
    });

    describe('canAutoAddMeeting', () => {
        it('should return true when auto-add is enabled with Meet provider', () => {
            (useCalendarUserSettings as Mock).mockReturnValue([
                {
                    AutoAddConferenceLink: {
                        Provider: AutoAddVideoConferenceLinkProvider.Meet,
                        DisplayNotification: 1,
                    },
                },
            ]);

            const { result } = renderHook(() => useAutoAddMeetLinkNotification());

            expect(result.current.canAutoAddMeeting).toBe(true);
        });

        it('should return false when auto-add is disabled (None)', () => {
            (useCalendarUserSettings as Mock).mockReturnValue([
                {
                    AutoAddConferenceLink: AutoAddVideoConferenceLinkProvider.None,
                },
            ]);

            const { result } = renderHook(() => useAutoAddMeetLinkNotification());

            expect(result.current.canAutoAddMeeting).toBe(false);
        });

        it('should return false when auto-add provider is Zoom', () => {
            (useCalendarUserSettings as Mock).mockReturnValue([
                {
                    AutoAddConferenceLink: {
                        Provider: AutoAddVideoConferenceLinkProvider.Zoom,
                        DisplayNotification: 1,
                    },
                },
            ]);

            const { result } = renderHook(() => useAutoAddMeetLinkNotification());

            expect(result.current.canAutoAddMeeting).toBe(false);
        });

        it('should return false when AutoAddConferenceLink is undefined', () => {
            (useCalendarUserSettings as Mock).mockReturnValue([
                {
                    AutoAddConferenceLink: undefined,
                },
            ]);

            const { result } = renderHook(() => useAutoAddMeetLinkNotification());

            expect(result.current.canAutoAddMeeting).toBe(false);
        });
    });

    describe('showAutoAddNotification', () => {
        it('should show notification when DisplayNotification is enabled', async () => {
            (useCalendarUserSettings as Mock).mockReturnValue([
                {
                    AutoAddConferenceLink: {
                        Provider: AutoAddVideoConferenceLinkProvider.Meet,
                        DisplayNotification: 1,
                    },
                },
            ]);

            const { result } = renderHook(() => useAutoAddMeetLinkNotification());

            await act(async () => {
                result.current.showAutoAddNotification();
            });

            expect(mockApi).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: { AutoAddConferenceLink: AutoAddVideoConferenceLinkProvider.Meet },
                })
            );
            expect(mockCreateNotification).toHaveBeenCalled();
            expect(mockCall).toHaveBeenCalled();
        });

        it('should not show notification when DisplayNotification is disabled', async () => {
            (useCalendarUserSettings as Mock).mockReturnValue([
                {
                    AutoAddConferenceLink: {
                        Provider: AutoAddVideoConferenceLinkProvider.Meet,
                        DisplayNotification: 0,
                    },
                },
            ]);

            const { result } = renderHook(() => useAutoAddMeetLinkNotification());

            await act(async () => {
                result.current.showAutoAddNotification();
            });

            expect(mockApi).not.toHaveBeenCalled();
            expect(mockCreateNotification).not.toHaveBeenCalled();
            expect(mockCall).not.toHaveBeenCalled();
        });

        it('should not show notification when auto-add is disabled', async () => {
            (useCalendarUserSettings as Mock).mockReturnValue([
                {
                    AutoAddConferenceLink: AutoAddVideoConferenceLinkProvider.None,
                },
            ]);

            const { result } = renderHook(() => useAutoAddMeetLinkNotification());

            await act(async () => {
                result.current.showAutoAddNotification();
            });

            expect(mockApi).not.toHaveBeenCalled();
            expect(mockCreateNotification).not.toHaveBeenCalled();
            expect(mockCall).not.toHaveBeenCalled();
        });
    });

    describe('handleDisableAutoAddMeetLink', () => {
        beforeEach(() => {
            (useCalendarUserSettings as Mock).mockReturnValue([
                {
                    AutoAddConferenceLink: {
                        Provider: AutoAddVideoConferenceLinkProvider.Meet,
                        DisplayNotification: 1,
                    },
                },
            ]);
        });

        it('should disable auto-add and show success notification', async () => {
            const { result } = renderHook(() => useAutoAddMeetLinkNotification());

            await act(async () => {
                await result.current.handleDisableAutoAddMeetLink();
            });

            expect(mockApi).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: { AutoAddConferenceLink: AutoAddVideoConferenceLinkProvider.None },
                })
            );
            expect(mockCall).toHaveBeenCalled();
            expect(mockCreateNotification).toHaveBeenCalledWith({
                text: expect.stringContaining('Auto-add'),
            });
        });

        it('should handle errors and show error notification', async () => {
            mockApi.mockRejectedValueOnce(new Error('API error'));

            const { result } = renderHook(() => useAutoAddMeetLinkNotification());

            await act(async () => {
                await result.current.handleDisableAutoAddMeetLink();
            });

            expect(mockCreateNotification).toHaveBeenCalledWith({
                type: 'error',
                text: expect.stringContaining('Failed'),
            });
        });

        it('should set isDisabling to true while disabling', async () => {
            let resolveApi: () => void;
            const apiPromise = new Promise<void>((resolve) => {
                resolveApi = resolve;
            });
            mockApi.mockReturnValue(apiPromise);

            const { result } = renderHook(() => useAutoAddMeetLinkNotification());

            expect(result.current.isDisabling).toBe(false);

            act(() => {
                void result.current.handleDisableAutoAddMeetLink();
            });

            expect(result.current.isDisabling).toBe(true);

            await act(async () => {
                resolveApi!();
                await apiPromise;
            });

            expect(result.current.isDisabling).toBe(false);
        });

        it('should not disable again if already disabling', async () => {
            let resolveApi: () => void;
            const apiPromise = new Promise<void>((resolve) => {
                resolveApi = resolve;
            });
            mockApi.mockReturnValue(apiPromise);

            const { result } = renderHook(() => useAutoAddMeetLinkNotification());

            act(() => {
                void result.current.handleDisableAutoAddMeetLink();
            });

            expect(result.current.isDisabling).toBe(true);

            await act(async () => {
                await result.current.handleDisableAutoAddMeetLink();
            });

            expect(mockApi).toHaveBeenCalledTimes(1);

            await act(async () => {
                resolveApi!();
                await apiPromise;
            });
        });
    });

    describe('useHasMeetProductAccess false', () => {
        beforeEach(() => {
            (useHasMeetProductAccess as Mock).mockReturnValue(false);
        });

        it('should return false when auto-add is enabled with Meet provider', () => {
            (useCalendarUserSettings as Mock).mockReturnValue([
                {
                    AutoAddConferenceLink: {
                        Provider: AutoAddVideoConferenceLinkProvider.Meet,
                        DisplayNotification: 1,
                    },
                },
            ]);

            const { result } = renderHook(() => useAutoAddMeetLinkNotification());

            expect(result.current.canAutoAddMeeting).toBe(false);
        });
    });
});
