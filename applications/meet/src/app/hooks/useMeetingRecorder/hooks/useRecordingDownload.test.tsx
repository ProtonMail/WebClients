import type { ReactNode } from 'react';
import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook, waitFor } from '@testing-library/react';

import { PreventLeaveProvider } from '@proton/components/hooks/usePreventLeave';
import { type OpfsRecording, recordingsReducer } from '@proton/meet/store/slices/recordingsSlice';
import { ProtonStoreContext } from '@proton/react-redux-store/ProtonStoreContext';

import { downloadOpfsRecording } from '../recordingStorage/recordingFiles';
import { useRecordingDownload } from './useRecordingDownload';

const { getUserKeys } = vi.hoisted(() => ({
    getUserKeys: vi.fn(async () => [{ privateKey: 'private-key' }]),
}));

vi.mock('@proton/account/userKeys/hooks', () => ({ useGetUserKeys: () => getUserKeys }));
vi.mock('@proton/app-context/useNotifications', () => ({ useNotifications: () => ({ createNotification: vi.fn() }) }));
vi.mock('@proton/meet/telemetry/meetTelemetry', () => ({
    TelemetryMeetDashboardEvents: {},
    sendMeetDashboardEvent: vi.fn(),
}));
vi.mock('../recordingStorage/recordingFiles', () => ({ downloadOpfsRecording: vi.fn() }));

const firstRecording: OpfsRecording = {
    name: 'recording-1795024636554.mp4',
    extension: 'mp4',
    createdAt: 1795024636554,
    size: 1024,
    folder: 'user-id-encrypted',
};

const secondRecording: OpfsRecording = { ...firstRecording, name: 'recording-1795165332717.mp4' };

const holdDownload = () => {
    const download = { finish: (_isFullRecording: boolean) => {}, fail: (_error: Error) => {} };
    vi.mocked(downloadOpfsRecording).mockReturnValueOnce(
        new Promise((resolve, reject) => {
            download.finish = resolve;
            download.fail = reject;
        })
    );
    return download;
};

const createWrapper = () => {
    const store = configureStore({ reducer: { ...recordingsReducer } });
    return function Wrapper({ children }: { children: ReactNode }) {
        return (
            <Provider context={ProtonStoreContext} store={store}>
                <PreventLeaveProvider>{children}</PreventLeaveProvider>
            </Provider>
        );
    };
};

const isPageUnloadPrevented = () => {
    const beforeUnload = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(beforeUnload);
    return beforeUnload.defaultPrevented;
};

describe('useRecordingDownload', () => {
    const setRecordingSaveInProgress = vi.fn();

    beforeEach(() => {
        getUserKeys.mockImplementation(async () => [{ privateKey: 'private-key' }]);
        vi.mocked(downloadOpfsRecording).mockReset();
        setRecordingSaveInProgress.mockReset();
        window.ipcMeetMessageBroker = { setRecordingSaveInProgress };
    });

    afterEach(() => {
        delete window.ipcMeetMessageBroker;
    });

    it('marks the recording as saving and tells the desktop app until the download ends', async () => {
        const download = holdDownload();
        const { result } = renderHook(() => useRecordingDownload(), { wrapper: createWrapper() });

        let downloadRecording = Promise.resolve();
        act(() => {
            downloadRecording = result.current.downloadRecording(firstRecording);
        });

        await waitFor(() => expect(result.current.isRecordingSaving(firstRecording)).toBe(true));
        expect(setRecordingSaveInProgress.mock.calls).toEqual([[true]]);

        await act(async () => {
            download.finish(true);
            await downloadRecording;
        });

        expect(result.current.isRecordingSaving(firstRecording)).toBe(false);
        expect(setRecordingSaveInProgress.mock.calls).toEqual([[true], [false]]);
    });

    it('ends the save and still rejects when the download fails', async () => {
        const download = holdDownload();
        const { result } = renderHook(() => useRecordingDownload(), { wrapper: createWrapper() });

        let downloadRecording = Promise.resolve();
        act(() => {
            downloadRecording = result.current.downloadRecording(firstRecording);
        });
        await waitFor(() => expect(result.current.isRecordingSaving(firstRecording)).toBe(true));

        await act(async () => {
            download.fail(new Error('Authentication tag mismatch'));
            await expect(downloadRecording).rejects.toThrow('Authentication tag mismatch');
        });

        expect(result.current.isRecordingSaving(firstRecording)).toBe(false);
        expect(setRecordingSaveInProgress.mock.calls).toEqual([[true], [false]]);
        expect(isPageUnloadPrevented()).toBe(false);
    });

    it('asks before the page unloads while a recording is being saved', async () => {
        const download = holdDownload();
        const { result } = renderHook(() => useRecordingDownload(), { wrapper: createWrapper() });
        expect(isPageUnloadPrevented()).toBe(false);

        let downloadRecording = Promise.resolve();
        act(() => {
            downloadRecording = result.current.downloadRecording(firstRecording);
        });
        await waitFor(() => expect(isPageUnloadPrevented()).toBe(true));

        await act(async () => {
            download.finish(true);
            await downloadRecording;
        });

        expect(isPageUnloadPrevented()).toBe(false);
    });

    it('keeps the other recording saving when one of two saves ends', async () => {
        const firstDownload = holdDownload();
        holdDownload();
        const { result } = renderHook(() => useRecordingDownload(), { wrapper: createWrapper() });

        let firstSave = Promise.resolve();
        act(() => {
            firstSave = result.current.downloadRecording(firstRecording);
        });
        act(() => {
            void result.current.downloadRecording(secondRecording);
        });
        await waitFor(() => expect(result.current.isRecordingSaving(secondRecording)).toBe(true));

        await act(async () => {
            firstDownload.finish(true);
            await firstSave;
        });

        expect(result.current.isRecordingSaving(firstRecording)).toBe(false);
        expect(result.current.isRecordingSaving(secondRecording)).toBe(true);
        expect(setRecordingSaveInProgress.mock.calls).toEqual([[true], [true], [false]]);
    });

    it('keeps asking before the page unloads when a save starts while another one ends', async () => {
        const firstDownload = holdDownload();
        holdDownload();
        const { result } = renderHook(() => useRecordingDownload(), { wrapper: createWrapper() });

        let firstSave = Promise.resolve();
        act(() => {
            firstSave = result.current.downloadRecording(firstRecording);
        });
        await waitFor(() => expect(isPageUnloadPrevented()).toBe(true));

        let releaseSecondUserKeys = () => {};
        getUserKeys.mockImplementationOnce(
            () =>
                new Promise((resolve) => {
                    releaseSecondUserKeys = () => resolve([{ privateKey: 'private-key' }]);
                })
        );
        act(() => {
            void result.current.downloadRecording(secondRecording);
        });

        await act(async () => {
            firstDownload.finish(true);
            await firstSave;
        });
        await act(async () => {
            releaseSecondUserKeys();
        });
        await waitFor(() => expect(downloadOpfsRecording).toHaveBeenCalledTimes(2));

        expect(isPageUnloadPrevented()).toBe(true);
    });

    it('shows a save started from another Download button as saving until it ends, even after that button unmounts', async () => {
        const download = holdDownload();
        const wrapper = createWrapper();
        const readyModal = renderHook(() => useRecordingDownload(), { wrapper });
        const postCallModal = renderHook(() => useRecordingDownload(), { wrapper });

        let saveFromReadyModal = Promise.resolve();
        act(() => {
            saveFromReadyModal = readyModal.result.current.downloadRecording(firstRecording);
        });
        await waitFor(() => expect(postCallModal.result.current.isRecordingSaving(firstRecording)).toBe(true));

        readyModal.unmount();
        await act(async () => {
            download.finish(true);
            await saveFromReadyModal;
        });

        expect(postCallModal.result.current.isRecordingSaving(firstRecording)).toBe(false);
    });
});
