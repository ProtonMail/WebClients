import { act, renderHook } from '@testing-library/react-hooks';
import { c } from 'ttag';

import { useDocsNotificationsSettings } from './useDocsNotificationsSettings';

jest.mock('../useApi', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('../useNotifications', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        createNotification: jest.fn(),
    })),
}));

describe('useDocsNotificationsSettings', () => {
    const mockApi = jest.fn();
    const mockCreateNotification = jest.fn();

    beforeEach(() => {
        jest.resetAllMocks();
        require('../useApi').default.mockReturnValue(mockApi);
        require('../useNotifications').default.mockReturnValue({
            createNotification: mockCreateNotification,
        });
        mockApi.mockImplementation(() =>
            Promise.resolve({
                UserSettings: {
                    DocsCommentsNotificationsEnabled: false,
                    DocsCommentsNotificationsIncludeDocumentName: false,
                },
            })
        );
    });

    it('should initialize with null values and not ready state', () => {
        const { result } = renderHook(() => useDocsNotificationsSettings());

        expect(result.current.emailNotificationsEnabled).toBe(null);
        expect(result.current.emailTitleEnabled).toBe(null);
        expect(result.current.isReady).toBe(false);
        expect(result.current.isSubmitting).toBe(false);
        expect(result.current.isLoading).toBe(true);
    });

    it('should fetch settings on mount', async () => {
        const mockSettings = {
            UserSettings: {
                DocsCommentsNotificationsEnabled: true,
                DocsCommentsNotificationsIncludeDocumentName: false,
            },
        };

        mockApi.mockResolvedValueOnce(mockSettings);

        const { result, waitForNextUpdate } = renderHook(() => useDocsNotificationsSettings());

        expect(result.current.isLoading).toBe(true);

        await waitForNextUpdate();

        expect(result.current.emailNotificationsEnabled).toBe(true);
        expect(result.current.emailTitleEnabled).toBe(false);
        expect(result.current.isReady).toBe(true);
        expect(result.current.isLoading).toBe(false);
    });

    it('should update notification settings successfully', async () => {
        mockApi.mockResolvedValueOnce({
            UserSettings: {
                DocsCommentsNotificationsEnabled: true,
                DocsCommentsNotificationsIncludeDocumentName: true,
            },
        });

        const { result, waitForNextUpdate } = renderHook(() => useDocsNotificationsSettings());
        await waitForNextUpdate();

        mockApi.mockResolvedValueOnce({});

        await act(async () => {
            await result.current.updateNotificationSettings({
                notificationsEnabled: false,
                includeTitleEnabled: false,
            });
        });

        expect(mockCreateNotification).toHaveBeenCalledWith({
            text: c('Info').t`Settings updated`,
        });

        expect(result.current.emailNotificationsEnabled).toBe(false);
        expect(result.current.emailTitleEnabled).toBe(false);
    });

    it('should handle update failure', async () => {
        mockApi.mockResolvedValueOnce({
            UserSettings: {
                DocsCommentsNotificationsEnabled: true,
                DocsCommentsNotificationsIncludeDocumentName: true,
            },
        });

        const { result, waitForNextUpdate } = renderHook(() => useDocsNotificationsSettings());
        await waitForNextUpdate();

        const error = new Error('Update failed');
        mockApi.mockRejectedValueOnce(error);

        await act(async () => {
            await result.current.updateNotificationSettings({
                notificationsEnabled: false,
                includeTitleEnabled: false,
            });
        });

        expect(mockCreateNotification).toHaveBeenCalledWith({
            type: 'error',
            text: c('Info').t`Settings update failed`,
        });

        // Values should remain unchanged after failed update
        expect(result.current.emailNotificationsEnabled).toBe(true);
        expect(result.current.emailTitleEnabled).toBe(true);
    });

    it('should handle email notifications toggle', async () => {
        mockApi.mockResolvedValueOnce({
            UserSettings: {
                DocsCommentsNotificationsEnabled: false,
                DocsCommentsNotificationsIncludeDocumentName: true,
            },
        });

        const { result, waitForNextUpdate } = renderHook(() => useDocsNotificationsSettings());
        await waitForNextUpdate();

        mockApi.mockResolvedValueOnce({});

        await act(async () => {
            await result.current.changeEmailNotificationsEnabledValue(true);
        });

        expect(mockApi).toHaveBeenCalledWith(
            expect.objectContaining({
                data: {
                    DocsCommentsNotificationsEnabled: true,
                    DocsCommentsNotificationsIncludeDocumentName: true,
                },
            })
        );
    });

    it('should handle document title toggle', async () => {
        mockApi.mockResolvedValueOnce({
            UserSettings: {
                DocsCommentsNotificationsEnabled: true,
                DocsCommentsNotificationsIncludeDocumentName: false,
            },
        });

        const { result, waitForNextUpdate } = renderHook(() => useDocsNotificationsSettings());
        await waitForNextUpdate();

        mockApi.mockResolvedValueOnce({});

        await act(async () => {
            await result.current.changeDocumentTitleEnabledValue(true);
        });

        expect(mockApi).toHaveBeenCalledWith(
            expect.objectContaining({
                data: {
                    DocsCommentsNotificationsEnabled: true,
                    DocsCommentsNotificationsIncludeDocumentName: true,
                },
            })
        );
    });
});
