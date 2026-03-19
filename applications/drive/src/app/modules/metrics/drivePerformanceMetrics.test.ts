import metrics from '@proton/metrics';
import { isMobile } from '@proton/shared/lib/helpers/browser';

import { DrivePerformanceMetrics } from './drivePerformanceMetrics';

jest.mock('@proton/metrics', () => ({
    __esModule: true,
    default: {
        drive_performance_v2_pageload_histogram: {
            observe: jest.fn(),
        },
        drive_performance_v2_dataload_histogram: {
            observe: jest.fn(),
        },
    },
}));

jest.mock('@proton/shared/lib/helpers/browser', () => ({
    isMobile: jest.fn(),
}));

jest.mock('../logging', () => ({
    logging: {
        getLogger: () => ({ debug: jest.fn() }),
    },
}));

type DataloadStage = 'first_item' | 'first_page' | 'full_list';

type DataloadObservePayload = {
    Labels: {
        stage: DataloadStage;
        loadType: 'first' | 'subsequent';
        plaftorm: 'desktop' | 'mobile';
    };
    Value: number;
};

describe('DrivePerformanceMetrics', () => {
    let performanceNowSpy: jest.SpyInstance;
    let nowMs: number;

    beforeEach(() => {
        jest.clearAllMocks();
        (isMobile as jest.Mock).mockReturnValue(false);
        nowMs = 0;
        performanceNowSpy = jest.spyOn(performance, 'now').mockImplementation(() => nowMs);
    });

    afterEach(() => {
        performanceNowSpy.mockRestore();
    });

    describe('markPageLoad', () => {
        test('observes private_page with desktop when not public and not mobile', () => {
            const m = new DrivePerformanceMetrics();
            nowMs = 2500;

            m.markPageLoad({ isPublic: false });

            expect(metrics.drive_performance_v2_pageload_histogram.observe).toHaveBeenCalledWith({
                Labels: {
                    pageType: 'private_page',
                    plaftorm: 'desktop',
                },
                Value: 2.5,
            });
        });

        test('observes public_page when isPublic is true', () => {
            const m = new DrivePerformanceMetrics();
            nowMs = 1000;

            m.markPageLoad({ isPublic: true });

            expect(metrics.drive_performance_v2_pageload_histogram.observe).toHaveBeenCalledWith({
                Labels: {
                    pageType: 'public_page',
                    plaftorm: 'desktop',
                },
                Value: 1,
            });
        });
    });

    describe('startDataLoad', () => {
        test('load with no items: only onFinished', () => {
            const m = new DrivePerformanceMetrics();
            nowMs = 100_000;
            const { onFinished } = m.startDataLoad('test');
            nowMs = 100_250;
            onFinished();

            expectDataloadHistogramObserved([dataloadPayload('full_list', 0.25)]);
        });

        test('load with first_item only, then onFinished', () => {
            const m = new DrivePerformanceMetrics();
            nowMs = 200_000;
            const { onItemsLoadedToState, onFinished } = m.startDataLoad('test');
            nowMs = 200_080;
            onItemsLoadedToState(7);
            nowMs = 200_400;
            onFinished();

            expectDataloadHistogramObserved([dataloadPayload('first_item', 0.08), dataloadPayload('full_list', 0.4)]);
        });

        test('first_item and first_page in one onItemsLoadedToState (25 items), then onFinished', () => {
            const m = new DrivePerformanceMetrics();
            nowMs = 300_000;
            const { onItemsLoadedToState, onFinished } = m.startDataLoad('test');
            nowMs = 300_150;
            onItemsLoadedToState(25);
            nowMs = 300_900;
            onFinished();

            expectDataloadHistogramObserved([
                dataloadPayload('first_item', 0.15),
                dataloadPayload('first_page', 0.15),
                dataloadPayload('full_list', 0.9),
            ]);
        });

        test('first_item then first_page in separate calls (15 + 15), then onFinished', () => {
            const m = new DrivePerformanceMetrics();
            nowMs = 400_000;
            const { onItemsLoadedToState, onFinished } = m.startDataLoad('test');
            nowMs = 400_050;
            onItemsLoadedToState(15);
            nowMs = 400_700;
            onItemsLoadedToState(15);
            nowMs = 401_000;
            onFinished();

            expectDataloadHistogramObserved([
                dataloadPayload('first_item', 0.05),
                dataloadPayload('first_page', 0.7),
                dataloadPayload('full_list', 1.0),
            ]);
        });

        test('second startDataLoad uses loadType subsequent after first completed', () => {
            const m = new DrivePerformanceMetrics();

            nowMs = 500_000;
            const first = m.startDataLoad('test');
            nowMs = 500_100;
            first.onFinished();

            nowMs = 600_000;
            const second = m.startDataLoad('test');
            nowMs = 600_200;
            second.onItemsLoadedToState(25);
            nowMs = 600_550;
            second.onFinished();

            expectDataloadHistogramObserved([
                dataloadPayload('full_list', 0.1, { loadType: 'first' }),
                dataloadPayload('first_item', 0.2, { loadType: 'subsequent' }),
                dataloadPayload('first_page', 0.2, { loadType: 'subsequent' }),
                dataloadPayload('full_list', 0.55, { loadType: 'subsequent' }),
            ]);
        });

        function expectDataloadHistogramObserved(expectedPayloads: DataloadObservePayload[]): void {
            const observe = metrics.drive_performance_v2_dataload_histogram.observe as jest.Mock;
            const actual = observe.mock.calls.map((call: [DataloadObservePayload]) => call[0]);
            expect(actual).toEqual(expectedPayloads);
        }

        function dataloadPayload(
            stage: DataloadStage,
            valueSeconds: number,
            labels: Partial<Pick<DataloadObservePayload['Labels'], 'loadType' | 'plaftorm'>> = {}
        ): DataloadObservePayload {
            return {
                Labels: {
                    stage,
                    loadType: labels.loadType ?? 'first',
                    plaftorm: labels.plaftorm ?? 'desktop',
                },
                Value: valueSeconds,
            };
        }
    });
});
