// @vitest-environment happy-dom
import { act, renderHook, waitFor } from '@testing-library/react';

import { useNotifications } from '@proton/app-context/useNotifications';
import { baseUseDispatch } from '@proton/react-redux-store/ProtonStoreContext';
import { SHOW_MOVED } from '@proton/shared/lib/mail/mailSettings';

import { useUpdateMailSetting } from './useUpdateMailSetting';

vi.mock('@proton/app-context/useNotifications');
vi.mock('@proton/react-redux-store/ProtonStoreContext');
// The real slice pulls in @proton/account, which is not needed here
// The mocked store keeps what the thunk writes, as the rollback only restores a value that is still ours
let mockSettings: Record<string, unknown> = {};
vi.mock('../store/mailSettings', () => ({
    mailSettingsActions: { updateMailSettings: (payload: unknown) => ({ type: 'updateMailSettings', payload }) },
    selectMailSettings: () => ({ value: mockSettings }),
}));

const MailSettings = { ShowMoved: SHOW_MOVED.NONE };

describe('useUpdateMailSetting', () => {
    const createNotification = vi.fn();
    const api = vi.fn();
    const dispatch = vi.fn();
    const storeDispatch = (action: any) =>
        typeof action === 'function'
            ? action(storeDispatch, () => ({}), { api })
            : (Object.assign(mockSettings, action.payload), dispatch(action));

    beforeEach(() => {
        vi.clearAllMocks();
        mockSettings = { ShowMoved: 1 };
        api.mockResolvedValue({ MailSettings });
        vi.mocked(useNotifications).mockReturnValue({ createNotification } as any);
        vi.mocked(baseUseDispatch).mockReturnValue(storeDispatch as any);
    });

    it('calls the endpoint of the setting, stores the response and notifies', async () => {
        const { result } = renderHook(() => useUpdateMailSetting());

        act(() => {
            result.current.update('ShowMoved', SHOW_MOVED.NONE);
        });
        await waitFor(() => expect(createNotification).toHaveBeenCalledWith({ text: 'Preference saved' }));

        expect(api).toHaveBeenCalledWith({
            url: 'mail/v4/settings/moved',
            method: 'put',
            data: { ShowMoved: SHOW_MOVED.NONE },
        });
        expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ payload: MailSettings }));
    });

    it('does not notify with notify: false', async () => {
        const { result } = renderHook(() => useUpdateMailSetting());

        act(() => {
            result.current.update('ShowMoved', SHOW_MOVED.NONE, { notify: false });
        });
        await waitFor(() => expect(api).toHaveBeenCalled());
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ payload: MailSettings }));
        expect(createNotification).not.toHaveBeenCalled();
    });

    it('notifies with the given text when notify is a string', async () => {
        const { result } = renderHook(() => useUpdateMailSetting());

        act(() => {
            result.current.update('ShowMoved', SHOW_MOVED.NONE, { notify: 'Custom text' });
        });
        await waitFor(() => expect(createNotification).toHaveBeenCalledWith({ text: 'Custom text' }));

        expect(createNotification).toHaveBeenCalledTimes(1);
    });

    it('calls onSuccess once the setting is saved', async () => {
        const onSuccess = vi.fn();
        const { result } = renderHook(() => useUpdateMailSetting());

        act(() => {
            result.current.update('ShowMoved', SHOW_MOVED.NONE, { notify: false, onSuccess });
        });
        await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    });

    it('supports a raw request', async () => {
        const { result } = renderHook(() => useUpdateMailSetting());

        act(() => {
            result.current.update('ImageProxy', { value: 2, action: 'add' });
        });
        await waitFor(() => expect(createNotification).toHaveBeenCalled());

        expect(api).toHaveBeenCalledWith(expect.objectContaining({ url: 'mail/v4/settings/imageproxy' }));
    });

    it('tracks the loading state of each setting separately', async () => {
        let answerShowMoved!: (response: unknown) => void;
        api.mockImplementation(({ url }: { url: string }) =>
            url.endsWith('/moved')
                ? new Promise((resolve) => (answerShowMoved = resolve))
                : Promise.resolve({ MailSettings: {} })
        );
        const { result } = renderHook(() => useUpdateMailSetting());

        act(() => {
            result.current.update('ShowMoved', SHOW_MOVED.NONE);
        });
        act(() => {
            result.current.update('Shortcuts', 1);
        });

        await waitFor(() => expect(result.current.isLoading('ShowMoved')).toBe(true));
        await waitFor(() => expect(result.current.isLoading('Shortcuts')).toBe(false));
        expect(result.current.loading).toBe(true);

        answerShowMoved({ MailSettings: MailSettings });
        await waitFor(() => expect(result.current.isLoading('ShowMoved')).toBe(false));
        expect(result.current.loading).toBe(false);
    });

    it('silences the api errors with silence: true', async () => {
        const { result } = renderHook(() => useUpdateMailSetting());

        act(() => {
            result.current.update('ShowMoved', SHOW_MOVED.NONE, { silence: true });
        });
        await waitFor(() => expect(api).toHaveBeenCalled());

        expect(api).toHaveBeenCalledWith(expect.objectContaining({ silence: true }));
    });

    it('restores the setting and does not notify when the request fails', async () => {
        api.mockRejectedValue(new Error('nope'));
        const { result } = renderHook(() => useUpdateMailSetting());

        act(() => {
            result.current.update('ShowMoved', SHOW_MOVED.NONE);
        });
        await waitFor(() => expect(api).toHaveBeenCalled());
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(dispatch).toHaveBeenLastCalledWith(expect.objectContaining({ payload: { ShowMoved: 1 } }));
        expect(createNotification).not.toHaveBeenCalled();
    });

    it('does not show the custom text nor call onSuccess when the request fails', async () => {
        api.mockRejectedValue(new Error('nope'));
        const onSuccess = vi.fn();
        const { result } = renderHook(() => useUpdateMailSetting());

        act(() => {
            result.current.update('ShowMoved', SHOW_MOVED.NONE, { notify: 'Custom text', onSuccess });
        });
        await waitFor(() => expect(api).toHaveBeenCalled());
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(createNotification).not.toHaveBeenCalled();
        expect(onSuccess).not.toHaveBeenCalled();
    });

    it('does not leave an unhandled rejection when the request fails', async () => {
        const onUnhandled = vi.fn();
        process.on('unhandledRejection', onUnhandled);
        api.mockRejectedValue(new Error('nope'));
        const { result } = renderHook(() => useUpdateMailSetting());

        act(() => {
            result.current.update('ShowMoved', SHOW_MOVED.NONE);
        });
        await waitFor(() => expect(result.current.loading).toBe(false));
        await new Promise((resolve) => setTimeout(resolve, 0));

        process.off('unhandledRejection', onUnhandled);
        expect(onUnhandled).not.toHaveBeenCalled();
    });
});
