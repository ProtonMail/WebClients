import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import { configureStore } from '@reduxjs/toolkit';
import { cleanup, render, screen } from '@testing-library/react';

import { recordingsReducer } from '@proton/meet/store/slices/recordingsSlice';
import { meetUserReducer } from '@proton/meet/store/slices/userSlice';
import { ProtonStoreContext } from '@proton/react-redux-store/ProtonStoreContext';

import { ManageRecordingsContainer } from './ManageRecordingsContainer';

vi.mock('@proton/unleash/useFlag', () => ({ useFlag: () => false }));
vi.mock('@proton/app-context/useNotifications', () => ({ useNotifications: () => ({ createNotification: vi.fn() }) }));
vi.mock('@proton/meet/hooks/useMeetErrorReporting', () => ({
    useMeetErrorReporting: () => ({ reportMeetError: vi.fn() }),
}));
vi.mock('@proton/meet/telemetry/meetTelemetry', () => ({
    TelemetryMeetDashboardEvents: {},
    sendMeetDashboardEvent: vi.fn(),
}));
vi.mock('../../components/PageHeader/PageHeader', () => ({ PageHeader: () => null }));
vi.mock('../../hooks/useMeetingRecorder/hooks/useRecordingDownload', () => ({
    useRecordingDownload: () => ({ downloadRecording: vi.fn() }),
}));
vi.mock('../../hooks/useMeetingRecorder/recordingStorage/recordingFiles', () => ({
    deleteOpfsRecording: vi.fn(),
    isDownloadAborted: vi.fn(),
    listAllOpfsRecordings: vi.fn(),
    listOpfsRecordings: async () => [
        { name: 'recording.webm', extension: 'webm', createdAt: Date.parse('2026-11-12T17:00:00Z'), size: 1024 },
    ],
}));

describe('ManageRecordingsContainer', () => {
    describe('on a Vancouver device whose browser has the rules from before the move to permanent time', () => {
        beforeEach(() => {
            vi.stubEnv('TZ', 'America/Los_Angeles');
            const deviceOptions = Intl.DateTimeFormat().resolvedOptions();
            vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
                ...deviceOptions,
                timeZone: 'America/Vancouver',
            });
        });

        afterEach(() => {
            cleanup();
            vi.unstubAllEnvs();
            vi.restoreAllMocks();
        });

        it('should show the recording date in Vancouver time', async () => {
            const store = configureStore({ reducer: { ...recordingsReducer, ...meetUserReducer } });

            render(
                <Provider context={ProtonStoreContext} store={store}>
                    <MemoryRouter>
                        <ManageRecordingsContainer />
                    </MemoryRouter>
                </Provider>
            );

            expect(await screen.findByText('Nov 12, 2026, 10:00 AM')).toBeInTheDocument();
        });
    });
});
