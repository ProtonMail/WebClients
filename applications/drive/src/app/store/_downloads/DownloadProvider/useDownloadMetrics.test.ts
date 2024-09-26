import { act, renderHook } from '@testing-library/react-hooks';

import metrics from '@proton/metrics';

import { TransferState } from '../../../components/TransferManager/transfer';
import { ShareType } from '../../_shares';
import useSharesState from '../../_shares/useSharesState';
import type { Download } from './interface';
import { getErrorCategory, useDownloadMetrics } from './useDownloadMetrics';

jest.mock('@proton/metrics', () => ({
    drive_download_success_rate_total: {
        increment: jest.fn(),
    },
    drive_download_errors_total: {
        increment: jest.fn(),
    },
    drive_download_erroring_users_total: {
        increment: jest.fn(),
    },
}));

jest.mock('../../_shares/useSharesState', () => ({
    __esModule: true,
    default: jest.fn(),
}));

const mockUseShareState = jest.mocked(useSharesState);

describe('getErrorCategory', () => {
    const testCases = [
        { state: TransferState.Error, error: { status: 503 }, expected: 'server_error', desc: 'unreachable error' },
        {
            state: TransferState.Error,
            error: { name: 'TimeoutError' },
            expected: 'server_error',
            desc: 'timeout error',
        },
        {
            state: TransferState.Error,
            error: { name: 'OfflineError' },
            expected: 'network_error',
            desc: 'offline error',
        },
        {
            state: TransferState.Error,
            error: { name: 'NetworkError' },
            expected: 'network_error',
            desc: 'network error',
        },
        { state: TransferState.NetworkError, error: {}, expected: 'network_error', desc: 'NetworkError state' },
        {
            state: TransferState.Error,
            error: { statusCode: 429 },
            expected: 'rate_limited',
            desc: 'rate limited error',
        },
        { state: TransferState.Error, error: { statusCode: 400 }, expected: '4xx', desc: '4xx error' },
        { state: TransferState.Error, error: { statusCode: 500 }, expected: '5xx', desc: '5xx error' },
        { state: TransferState.Error, error: {}, expected: 'unknown', desc: 'unknown error' },
    ];

    testCases.forEach(({ state, error, expected, desc }) => {
        it(`should return ${expected} for ${desc}`, () => {
            expect(getErrorCategory(state, error)).toBe(expected);
        });
    });
});

describe('useDownloadMetrics', () => {
    const mockGetShare = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseShareState.mockReturnValue({ getShare: mockGetShare } as any);
    });

    it('should observe downloads and update metrics for successful downloads', () => {
        mockGetShare.mockReturnValue({ type: ShareType.default });

        const { result } = renderHook(() => useDownloadMetrics('download'));

        const testDownloads = [
            {
                id: '1',
                state: TransferState.Done,
                links: [{ shareId: 'share1' }],
                error: null,
            },
        ] as unknown as Download[];

        act(() => {
            result.current.observe(testDownloads);
        });

        expect(metrics.drive_download_success_rate_total.increment).toHaveBeenCalledWith({
            status: 'success',
            retry: 'false',
            shareType: 'main',
        });
    });

    it('should observe downloads and update metrics for failed downloads', () => {
        mockGetShare.mockReturnValue({ type: ShareType.default });

        const { result } = renderHook(() => useDownloadMetrics('download'));

        const testDownloads: Download[] = [
            {
                id: '2',
                state: TransferState.Error,
                links: [{ shareId: 'share2' }],
                error: { statusCode: 500 },
            },
        ] as unknown as Download[];

        act(() => {
            result.current.observe(testDownloads);
        });

        expect(metrics.drive_download_success_rate_total.increment).toHaveBeenCalledWith({
            status: 'failure',
            retry: 'false',
            shareType: 'main',
        });

        expect(metrics.drive_download_errors_total.increment).toHaveBeenCalledWith({
            type: '5xx',
            initiator: 'download',
            shareType: 'main',
        });
    });

    it('should observe downloads and update metrics correctly for retried downloads', () => {
        mockGetShare.mockReturnValue({ type: ShareType.default });

        const { result } = renderHook(() => useDownloadMetrics('download'));

        const testDownloads: Download[] = [
            {
                id: '2',
                state: TransferState.Error,
                links: [{ shareId: 'share2' }],
                error: { statusCode: 500 },
            },
        ] as unknown as Download[];

        act(() => {
            result.current.observe(testDownloads);
        });

        expect(metrics.drive_download_success_rate_total.increment).toHaveBeenCalledWith({
            status: 'failure',
            retry: 'false',
            shareType: 'main',
        });

        expect(metrics.drive_download_errors_total.increment).toHaveBeenCalledWith({
            type: '5xx',
            initiator: 'download',
            shareType: 'main',
        });

        act(() => {
            const testDownloadsDone: Download[] = [
                {
                    id: '2',
                    state: TransferState.Done,
                    links: [{ shareId: 'share2' }],
                    error: null,
                    retries: 1,
                },
            ] as unknown as Download[];
            result.current.observe(testDownloadsDone);
        });

        expect(metrics.drive_download_success_rate_total.increment).toHaveBeenCalledWith({
            status: 'success',
            retry: 'true',
            shareType: 'main',
        });
    });

    it('should not process the same download twice', () => {
        mockGetShare.mockReturnValue({ type: ShareType.default });

        const { result } = renderHook(() => useDownloadMetrics('download'));

        const testDownload: Download = {
            id: '3',
            state: TransferState.Done,
            links: [{ shareId: 'share3' }],
            error: null,
        } as unknown as Download;

        act(() => {
            result.current.observe([testDownload]);
        });

        act(() => {
            result.current.observe([testDownload]);
        });

        expect(metrics.drive_download_success_rate_total.increment).toHaveBeenCalledTimes(1);
    });

    it('should not handle multiple LinkDownload in a download', () => {
        mockGetShare.mockReturnValueOnce({ type: ShareType.default });

        const { result } = renderHook(() => useDownloadMetrics('download'));

        const testDownload = {
            id: '4',
            state: TransferState.Done,
            links: [{ shareId: 'share4a' }, { shareId: 'share4b' }],
            error: null,
        } as unknown as Download;

        act(() => {
            result.current.observe([testDownload]);
        });

        expect(metrics.drive_download_success_rate_total.increment).toHaveBeenCalledTimes(1);
        expect(metrics.drive_download_success_rate_total.increment).toHaveBeenNthCalledWith(1, {
            status: 'success',
            retry: 'false',
            shareType: 'main',
        });
    });

    it('should handle different error states', () => {
        mockGetShare.mockReturnValue({ type: ShareType.default });

        const { result } = renderHook(() => useDownloadMetrics('download'));

        const testDownloads: Download[] = [
            {
                id: '5',
                state: TransferState.NetworkError,
                links: [{ shareId: 'share5' }],
                error: { isNetwork: true },
            },
            {
                id: '6',
                state: TransferState.Error,
                links: [{ shareId: 'share6' }],
                error: null,
            },
        ] as unknown as Download[];

        act(() => {
            result.current.observe(testDownloads);
        });

        expect(metrics.drive_download_errors_total.increment).toHaveBeenCalledTimes(2);
        expect(metrics.drive_download_errors_total.increment).toHaveBeenCalledWith({
            type: 'network_error',
            initiator: 'download',
            shareType: 'main',
        });
        expect(metrics.drive_download_errors_total.increment).toHaveBeenCalledWith({
            type: 'unknown',
            initiator: 'download',
            shareType: 'main',
        });
    });

    it('should only report failed users every 5min', () => {
        jest.useFakeTimers().setSystemTime(new Date('2020-01-01 10:00:00'));
        mockGetShare.mockReturnValue({ type: ShareType.default });
        const { result } = renderHook(() => useDownloadMetrics('download'));

        act(() => {
            result.current.observe([
                {
                    id: '2',
                    state: TransferState.Error,
                    links: [{ shareId: 'share2' }],
                    error: { statusCode: 500 },
                },
            ] as unknown as Download[]);
        });
        expect(metrics.drive_download_erroring_users_total.increment).toHaveBeenCalledWith({
            plan: 'unknown',
            shareType: 'main',
        });

        // 1 min passed
        jest.useFakeTimers().setSystemTime(new Date('2020-01-01 10:01:00'));
        act(() => {
            result.current.observe([
                {
                    id: '234',
                    state: TransferState.Error,
                    links: [{ shareId: 'share234' }],
                    error: { statusCode: 500 },
                },
            ] as unknown as Download[]);
        });
        expect(metrics.drive_download_erroring_users_total.increment).toHaveBeenCalledTimes(1);

        // 4min and 1 second passed
        jest.useFakeTimers().setSystemTime(new Date('2020-01-01 10:05:01'));
        act(() => {
            result.current.observe([
                {
                    id: '789',
                    state: TransferState.Error,
                    links: [{ shareId: 'abc' }],
                    error: { statusCode: 500 },
                },
            ] as unknown as Download[]);
        });
        expect(metrics.drive_download_erroring_users_total.increment).toHaveBeenCalledTimes(2);
    });
});
