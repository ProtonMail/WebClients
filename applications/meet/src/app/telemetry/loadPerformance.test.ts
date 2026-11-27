import { TelemetryMeetPerformanceEvents, sendMeetPerformanceEvent } from '@proton/meet/telemetry/meetTelemetry';

import { MeetCoreWorkerClient } from '../wasm/MeetCoreWorkerClient';
import { createMeetCoreClientMock } from '../wasm/__mocks__/MeetCoreClient.mock';
import {
    markBootstrapEnd,
    markBootstrapLoaderUnmount,
    markBootstrapStart,
    markPrejoinLoaderUnmount,
    setWasmMode,
} from './loadPerformance';

vi.mock('@proton/meet/telemetry/meetTelemetry', async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    sendMeetPerformanceEvent: vi.fn(),
}));

class FakeWorker {
    public addEventListener() {}
    public removeEventListener() {}
    public postMessage() {}
    public terminate() {}
}

const startBootstrap = (pathname: string) => {
    window.history.pushState({}, '', pathname);
    markBootstrapStart();
    markBootstrapEnd();
};

describe('app_loaded', () => {
    beforeEach(() => {
        vi.mocked(sendMeetPerformanceEvent).mockClear();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('is sent once on the dashboard when meet-core gets ready after the bootstrap loader is gone', () => {
        startBootstrap('/dashboard');

        markBootstrapLoaderUnmount();
        expect(sendMeetPerformanceEvent).not.toHaveBeenCalled();

        setWasmMode(createMeetCoreClientMock());
        markBootstrapLoaderUnmount();

        expect(sendMeetPerformanceEvent).toHaveBeenCalledTimes(1);
        expect(sendMeetPerformanceEvent).toHaveBeenCalledWith(
            TelemetryMeetPerformanceEvents.app_loaded,
            expect.objectContaining({ entryRoute: 'dashboard', wasmMode: 'direct' }),
            expect.objectContaining({ prejoinReadyMs: undefined })
        );
    });

    it('is sent on the dashboard when the bootstrap loader goes away after meet-core is ready', () => {
        vi.stubGlobal('Worker', FakeWorker);
        startBootstrap('/dashboard');

        setWasmMode(new MeetCoreWorkerClient());
        expect(sendMeetPerformanceEvent).not.toHaveBeenCalled();

        markBootstrapLoaderUnmount();

        expect(sendMeetPerformanceEvent).toHaveBeenCalledTimes(1);
        expect(sendMeetPerformanceEvent).toHaveBeenCalledWith(
            TelemetryMeetPerformanceEvents.app_loaded,
            expect.objectContaining({ wasmMode: 'worker' }),
            expect.anything()
        );
    });

    it('waits for the prejoin loader on join', () => {
        startBootstrap('/join/id');

        markBootstrapLoaderUnmount();
        setWasmMode(createMeetCoreClientMock());
        expect(sendMeetPerformanceEvent).not.toHaveBeenCalled();

        markPrejoinLoaderUnmount();

        expect(sendMeetPerformanceEvent).toHaveBeenCalledTimes(1);
        expect(sendMeetPerformanceEvent).toHaveBeenCalledWith(
            TelemetryMeetPerformanceEvents.app_loaded,
            expect.objectContaining({ entryRoute: 'join' }),
            expect.objectContaining({ prejoinReadyMs: expect.any(Number) })
        );
    });

    it('waits for meet-core on join once both loaders are gone', () => {
        startBootstrap('/join/id');

        markBootstrapLoaderUnmount();
        markPrejoinLoaderUnmount();
        expect(sendMeetPerformanceEvent).not.toHaveBeenCalled();

        setWasmMode(createMeetCoreClientMock());

        expect(sendMeetPerformanceEvent).toHaveBeenCalledTimes(1);
    });
});
