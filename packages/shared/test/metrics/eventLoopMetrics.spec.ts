import metrics from '@proton/metrics/index';

import { eventLoopTimingTracker } from '../../lib/metrics/eventLoopMetrics';

describe('EventLoopTimingTracker', () => {
    let mockHistogramObserve: jasmine.Spy;
    let mockTime = 0;

    beforeEach(() => {
        // Mock the histogram observe method
        mockHistogramObserve = jasmine.createSpy('observe');
        metrics.core_event_loop_five_processing_time_histogram.observe = mockHistogramObserve;
        metrics.core_event_loop_six_processing_time_histogram.observe = mockHistogramObserve;

        eventLoopTimingTracker.reset();
        mockTime = 0;
        // Use our own time provider for testing
        (eventLoopTimingTracker as any).setTimeProvider(() => mockTime);
    });

    afterEach(() => {
        // Reset time provider to default
        (eventLoopTimingTracker as any).setTimeProvider(() => Date.now());
    });

    const tickTime = (milliseconds: number) => {
        mockTime += milliseconds;
    };

    describe('v5 processing timing', () => {
        it('should track v5 processing time and send telemetry', () => {
            // Start timing
            eventLoopTimingTracker.startV5Processing();

            // Advance time by 100ms
            tickTime(100);

            // End timing
            eventLoopTimingTracker.endV5Processing(false);

            expect(mockHistogramObserve).toHaveBeenCalledWith({
                Value: 0.1, // 100ms converted to seconds
                Labels: {
                    has_more: 'false',
                    interval_since_last_ms: '<1000',
                },
            });
        });

        it('should handle hasMore flag correctly for v5', () => {
            eventLoopTimingTracker.startV5Processing();
            tickTime(50);
            eventLoopTimingTracker.endV5Processing(true);

            expect(mockHistogramObserve).toHaveBeenCalledWith({
                Value: 0.05, // 50ms converted to seconds
                Labels: {
                    has_more: 'true',
                    interval_since_last_ms: '<1000',
                },
            });
        });

        it('should not send telemetry if start was not called for v5', () => {
            eventLoopTimingTracker.endV5Processing(false);
            expect(mockHistogramObserve).not.toHaveBeenCalled();
        });

        it('should track interval between v5 requests', () => {
            // First request
            eventLoopTimingTracker.startV5Processing();
            tickTime(100);
            eventLoopTimingTracker.endV5Processing(false);

            expect(mockHistogramObserve).toHaveBeenCalledWith({
                Value: 0.1, // 100ms converted to seconds
                Labels: {
                    has_more: 'false',
                    interval_since_last_ms: '<1000',
                },
            });

            // Reset spy to check only the second call
            mockHistogramObserve.calls.reset();

            // Second request after 30 seconds (typical interval)
            tickTime(30000);
            eventLoopTimingTracker.startV5Processing();
            tickTime(120);
            eventLoopTimingTracker.endV5Processing(false);

            expect(mockHistogramObserve).toHaveBeenCalledWith({
                Value: 0.12, // 120ms converted to seconds
                Labels: {
                    has_more: 'false',
                    interval_since_last_ms: '10000-30000',
                },
            });
        });
    });

    describe('v6 processing timing', () => {
        it('should track v6 processing time and send telemetry', () => {
            eventLoopTimingTracker.startV6Processing();
            tickTime(200);
            eventLoopTimingTracker.endV6Processing(false, 3, 'core', 0);

            expect(mockHistogramObserve).toHaveBeenCalledWith({
                Value: 0.2, // 200ms converted to seconds
                Labels: {
                    has_more: 'false',
                    api_calls_count: '3',
                    api_failures_count: '0',
                    event_loop_type: 'core',
                    interval_since_last_ms: '<1000',
                },
            });
        });

        it('should handle hasMore flag and apiCallsCount for v6', () => {
            eventLoopTimingTracker.startV6Processing();
            tickTime(75);
            eventLoopTimingTracker.endV6Processing(true, 5, 'mail', 1);

            expect(mockHistogramObserve).toHaveBeenCalledWith({
                Value: 0.075, // 75ms converted to seconds
                Labels: {
                    has_more: 'true',
                    api_calls_count: '5',
                    api_failures_count: '1',
                    event_loop_type: 'mail',
                    interval_since_last_ms: '<1000',
                },
            });
        });

        it('should not send telemetry if start was not called for v6', () => {
            eventLoopTimingTracker.endV6Processing(false, 0, 'core');
            expect(mockHistogramObserve).not.toHaveBeenCalled();
        });

        it('should track interval between v6 requests for same loop type', () => {
            // First core request
            eventLoopTimingTracker.startV6Processing('core');
            tickTime(150);
            eventLoopTimingTracker.endV6Processing(false, 2, 'core', 0);

            expect(mockHistogramObserve).toHaveBeenCalledWith({
                Value: 0.15, // 150ms converted to seconds
                Labels: {
                    has_more: 'false',
                    api_calls_count: '2',
                    api_failures_count: '0',
                    event_loop_type: 'core',
                    interval_since_last_ms: '<1000',
                },
            });

            // Reset spy to check only the second call
            mockHistogramObserve.calls.reset();

            // Second core request after 30 seconds
            tickTime(30000);
            eventLoopTimingTracker.startV6Processing('core');
            tickTime(180);
            eventLoopTimingTracker.endV6Processing(false, 3, 'core', 1);

            expect(mockHistogramObserve).toHaveBeenCalledWith({
                Value: 0.18, // 180ms converted to seconds
                Labels: {
                    has_more: 'false',
                    api_calls_count: '3',
                    api_failures_count: '1',
                    event_loop_type: 'core',
                    interval_since_last_ms: '10000-30000',
                },
            });
        });

        it('should track API failures count for v6', () => {
            eventLoopTimingTracker.startV6Processing('mail');
            tickTime(200);
            eventLoopTimingTracker.endV6Processing(false, 5, 'mail', 2); // 2 failures out of 5 calls

            expect(mockHistogramObserve).toHaveBeenCalledWith({
                Value: 0.2, // 200ms converted to seconds
                Labels: {
                    has_more: 'false',
                    api_calls_count: '5',
                    api_failures_count: '2',
                    event_loop_type: 'mail',
                    interval_since_last_ms: '<1000',
                },
            });
        });
    });

    describe('reset', () => {
        it('should reset tracking state', () => {
            eventLoopTimingTracker.startV5Processing();
            eventLoopTimingTracker.startV6Processing();
            eventLoopTimingTracker.reset();

            eventLoopTimingTracker.endV5Processing(false);
            eventLoopTimingTracker.endV6Processing(false, 0, 'core');

            expect(mockHistogramObserve).not.toHaveBeenCalled();
        });
    });
});
