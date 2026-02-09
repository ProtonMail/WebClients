import { MINUTE } from '@proton/shared/lib/constants';
import { spanToJSON, startInactiveSpan } from '@proton/shared/lib/helpers/sentry';

import { getApplyLocationTracker } from 'proton-mail/helpers/location/applyLocationPerformanceTracker';
import type { Element } from 'proton-mail/models/element';

// Unmock this module so we can test the real implementation
jest.unmock('proton-mail/helpers/location/applyLocationPerformanceTracker');

jest.mock('@proton/shared/lib/helpers/desktop', () => ({
    isElectronApp: false,
}));

jest.mock('@proton/shared/lib/helpers/sentry', () => ({
    startInactiveSpan: jest.fn(),
    spanToJSON: jest.fn(),
    SentryMailPerformanceInitiatives: {
        APPLY_LOCATION_PERFORMANCE: 'apply-location-performance',
    },
}));

jest.mock('proton-mail/metrics/mailMetricsHelper', () => ({
    getLabelID: jest.fn((id: string) => id),
}));

describe('ApplyLocationPerformanceTracker', () => {
    let mockSpan: { end: jest.Mock; setStatus: jest.Mock };

    const tracker = getApplyLocationTracker();

    beforeEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();

        mockSpan = { end: jest.fn(), setStatus: jest.fn() };
        (startInactiveSpan as jest.Mock).mockReturnValue(mockSpan);
        (spanToJSON as jest.Mock).mockReturnValue({});
    });

    describe('getSpanName', () => {
        it('should return the correct span name for a given element ID', () => {
            expect(tracker.getSpanName('element-123')).toBe('APPLY_LOCATION_element-123');
        });
    });

    describe('mark', () => {
        it('should create a span with correct name and attributes', () => {
            const element = { ID: 'element-123' } as Element;

            tracker.mark({
                elements: [element],
                actionType: 'move',
                sourceLabelID: 'inbox',
                destinationLabelID: 'trash',
                conversationMode: false,
                isCategoryViewEnabled: false,
            });

            expect(startInactiveSpan).toHaveBeenCalledWith(
                tracker.getSpanName('element-123'),
                'apply-location-performance',
                {
                    destinationLabelID: 'trash',
                    isDesktopApp: 'false',
                    isCategoryViewEnabled: 'false',
                    sourceLabelID: 'inbox',
                    type: 'move',
                }
            );
        });

        it('should use ConversationID for messages in conversation mode', () => {
            const element = { ID: 'msg-123', ConversationID: 'conv-456' } as Element;

            tracker.mark({
                elements: [element],
                actionType: 'move',
                sourceLabelID: 'inbox',
                destinationLabelID: 'trash',
                conversationMode: true,
                isCategoryViewEnabled: false,
            });

            expect(startInactiveSpan).toHaveBeenCalledWith(
                tracker.getSpanName('conv-456'),
                expect.any(String),
                expect.any(Object)
            );
        });

        it('should use element ID for messages when not in conversation mode', () => {
            const element = { ID: 'msg-789', ConversationID: 'conv-012' } as Element;

            tracker.mark({
                elements: [element],
                actionType: 'move',
                sourceLabelID: 'inbox',
                destinationLabelID: 'trash',
                conversationMode: false,
                isCategoryViewEnabled: false,
            });

            expect(startInactiveSpan).toHaveBeenCalledWith(
                tracker.getSpanName('msg-789'),
                expect.any(String),
                expect.any(Object)
            );
        });

        it('should create spans for multiple elements', () => {
            const elements = [
                { ID: 'element-1' } as Element,
                { ID: 'element-2' } as Element,
                { ID: 'element-3' } as Element,
            ];

            tracker.mark({
                elements,
                actionType: 'move',
                sourceLabelID: 'inbox',
                destinationLabelID: 'trash',
                conversationMode: false,
                isCategoryViewEnabled: false,
            });

            expect(startInactiveSpan).toHaveBeenCalledTimes(3);
            expect(startInactiveSpan).toHaveBeenCalledWith(
                tracker.getSpanName('element-1'),
                expect.any(String),
                expect.any(Object)
            );
            expect(startInactiveSpan).toHaveBeenCalledWith(
                tracker.getSpanName('element-2'),
                expect.any(String),
                expect.any(Object)
            );
            expect(startInactiveSpan).toHaveBeenCalledWith(
                tracker.getSpanName('element-3'),
                expect.any(String),
                expect.any(Object)
            );
        });

        it('should not store span when startInactiveSpan returns undefined', () => {
            (startInactiveSpan as jest.Mock).mockReturnValue(undefined);

            const element = { ID: 'element-no-span' } as Element;

            tracker.mark({
                elements: [element],
                actionType: 'move',
                sourceLabelID: 'inbox',
                destinationLabelID: 'trash',
                conversationMode: false,
                isCategoryViewEnabled: false,
            });

            // Measuring should do nothing since the span was not stored
            tracker.measure('element-no-span');
            expect(mockSpan.end).not.toHaveBeenCalled();
        });
    });

    describe('measure', () => {
        it('should not end any span when no mark exists', () => {
            tracker.measure('unknown-element');

            expect(mockSpan.end).not.toHaveBeenCalled();
        });

        it('should end the span when mark exists', () => {
            const element = { ID: 'measure-element-1' } as Element;

            tracker.mark({
                elements: [element],
                actionType: 'move',
                sourceLabelID: 'inbox',
                destinationLabelID: 'trash',
                conversationMode: false,
                isCategoryViewEnabled: false,
            });

            tracker.measure('measure-element-1');

            expect(mockSpan.end).toHaveBeenCalledTimes(1);
        });

        it('should remove the span after measuring', () => {
            const element = { ID: 'measure-element-2' } as Element;

            tracker.mark({
                elements: [element],
                actionType: 'move',
                sourceLabelID: 'inbox',
                destinationLabelID: 'trash',
                conversationMode: false,
                isCategoryViewEnabled: false,
            });

            tracker.measure('measure-element-2');
            expect(mockSpan.end).toHaveBeenCalledTimes(1);

            mockSpan.end.mockClear();

            // Measuring again should not end the span since it was already removed
            tracker.measure('measure-element-2');
            expect(mockSpan.end).not.toHaveBeenCalled();
        });
    });

    describe('cleanup', () => {
        it('should end old spans with deadline_exceeded status', async () => {
            const now = Date.now();
            const oldStartTimestamp = (now - MINUTE - 100) / 1000;

            jest.spyOn(Date, 'now').mockReturnValue(now);
            (spanToJSON as jest.Mock).mockReturnValue({ start_timestamp: oldStartTimestamp });

            const element = { ID: 'cleanup-old-element' } as Element;

            tracker.mark({
                elements: [element],
                actionType: 'move',
                sourceLabelID: 'inbox',
                destinationLabelID: 'trash',
                conversationMode: false,
                isCategoryViewEnabled: false,
            });

            await new Promise<void>((resolve) => queueMicrotask(resolve));

            expect(mockSpan.setStatus).toHaveBeenCalledWith('deadline_exceeded');
            expect(mockSpan.end).toHaveBeenCalled();
        });

        it('should not end recent spans', async () => {
            const now = Date.now();
            const recentStartTimestamp = (now - 100) / 1000;

            jest.spyOn(Date, 'now').mockReturnValue(now);
            (spanToJSON as jest.Mock).mockReturnValue({ start_timestamp: recentStartTimestamp });

            const element = { ID: 'cleanup-recent-element' } as Element;

            tracker.mark({
                elements: [element],
                actionType: 'move',
                sourceLabelID: 'inbox',
                destinationLabelID: 'trash',
                conversationMode: false,
                isCategoryViewEnabled: false,
            });

            await new Promise<void>((resolve) => queueMicrotask(resolve));

            expect(mockSpan.setStatus).not.toHaveBeenCalled();
            expect(mockSpan.end).not.toHaveBeenCalled();
        });
    });
});
