import { MINUTE } from '@proton/shared/lib/constants';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';

import {
    APPLY_LABEL_MARK_PREFIX,
    getApplyLocationTracker,
} from 'proton-mail/helpers/location/applyLocationPerformanceTracker';
import type { Element } from 'proton-mail/models/element';

// Unmock this module so we can test the real implementation
jest.unmock('proton-mail/helpers/location/applyLocationPerformanceTracker');

jest.mock('@proton/shared/lib/helpers/desktop', () => ({
    isElectronApp: false,
}));

jest.mock('@proton/shared/lib/helpers/sentry', () => ({
    captureMessage: jest.fn(),
    SentryMailPerformanceInitiatives: {
        APPLY_LOCATION_PERFORMANCE: 'apply-location-performance',
    },
}));

jest.mock('proton-mail/metrics/mailMetricsHelper', () => ({
    getLabelID: jest.fn((id: string) => id),
}));

describe('ApplyLocationPerformanceTracker', () => {
    const mockPerformance = {
        mark: jest.fn(),
        clearMarks: jest.fn(),
        getEntriesByName: jest.fn(),
        getEntriesByType: jest.fn(),
        now: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();

        Object.defineProperty(global, 'performance', {
            value: mockPerformance,
            writable: true,
        });

        mockPerformance.now.mockReturnValue(1000);
        mockPerformance.getEntriesByName.mockReturnValue([]);
        mockPerformance.getEntriesByType.mockReturnValue([]);
    });

    describe('mark', () => {
        it('should create a performance mark with correct prefix', () => {
            const element = { ID: 'element-123' } as Element;

            getApplyLocationTracker().mark({
                elements: [element],
                actionType: 'move',
                sourceLabelID: 'inbox',
                destinationLabelID: 'trash',
                conversationMode: false,
                isCategoryViewEnabled: false,
            });

            expect(mockPerformance.mark).toHaveBeenCalledWith(
                `${APPLY_LABEL_MARK_PREFIX}element-123`,
                expect.objectContaining({
                    detail: expect.objectContaining({
                        sourceLabelID: 'inbox',
                        destinationLabelID: 'trash',
                        type: 'move',
                    }),
                })
            );
        });

        it('should clear existing marks before creating new ones', () => {
            const element = { ID: 'element-123' } as Element;

            getApplyLocationTracker().mark({
                elements: [element],
                actionType: 'move',
                sourceLabelID: 'inbox',
                destinationLabelID: 'trash',
                conversationMode: false,
                isCategoryViewEnabled: false,
            });

            const clearMarksCallOrder = mockPerformance.clearMarks.mock.invocationCallOrder[0];
            const markCallOrder = mockPerformance.mark.mock.invocationCallOrder[0];

            expect(mockPerformance.clearMarks).toHaveBeenCalledWith(`${APPLY_LABEL_MARK_PREFIX}element-123`);
            expect(clearMarksCallOrder).toBeLessThan(markCallOrder);
        });

        it('should use ConversationID for messages in conversation mode', () => {
            const element = { ID: 'msg-123', ConversationID: 'conv-456' } as Element;

            getApplyLocationTracker().mark({
                elements: [element],
                actionType: 'move',
                sourceLabelID: 'inbox',
                destinationLabelID: 'trash',
                conversationMode: true,
                isCategoryViewEnabled: false,
            });

            expect(mockPerformance.mark).toHaveBeenCalledWith(`${APPLY_LABEL_MARK_PREFIX}conv-456`, expect.any(Object));
        });

        it('should use element ID for messages when not in conversation mode', () => {
            const element = { ID: 'msg-123', ConversationID: 'conv-456' } as Element;

            getApplyLocationTracker().mark({
                elements: [element],
                actionType: 'move',
                sourceLabelID: 'inbox',
                destinationLabelID: 'trash',
                conversationMode: false,
                isCategoryViewEnabled: false,
            });

            expect(mockPerformance.mark).toHaveBeenCalledWith(`${APPLY_LABEL_MARK_PREFIX}msg-123`, expect.any(Object));
        });

        it('should create marks for multiple elements', () => {
            const elements = [
                { ID: 'element-1' } as Element,
                { ID: 'element-2' } as Element,
                { ID: 'element-3' } as Element,
            ];

            getApplyLocationTracker().mark({
                elements,
                actionType: 'move',
                sourceLabelID: 'inbox',
                destinationLabelID: 'trash',
                conversationMode: false,
                isCategoryViewEnabled: false,
            });

            expect(mockPerformance.mark).toHaveBeenCalledTimes(3);
            expect(mockPerformance.mark).toHaveBeenCalledWith(
                `${APPLY_LABEL_MARK_PREFIX}element-1`,
                expect.any(Object)
            );
            expect(mockPerformance.mark).toHaveBeenCalledWith(
                `${APPLY_LABEL_MARK_PREFIX}element-2`,
                expect.any(Object)
            );
            expect(mockPerformance.mark).toHaveBeenCalledWith(
                `${APPLY_LABEL_MARK_PREFIX}element-3`,
                expect.any(Object)
            );
        });
    });

    describe('measure', () => {
        it('should return null when no mark exists', () => {
            mockPerformance.getEntriesByName.mockReturnValue([]);

            const result = getApplyLocationTracker().measure('unknown-element');

            expect(result).toBeNull();
            expect(captureMessage).not.toHaveBeenCalled();
        });

        it('should return duration and detail when mark exists', () => {
            const markDetail = {
                sourceLabelID: 'inbox',
                destinationLabelID: 'trash',
                type: 'move',
                isDesktopApp: 'false',
            };

            mockPerformance.getEntriesByName.mockReturnValue([
                { name: `${APPLY_LABEL_MARK_PREFIX}element-123`, startTime: 500, detail: markDetail },
            ]);
            mockPerformance.now.mockReturnValue(750);

            const result = getApplyLocationTracker().measure('element-123');

            expect(result).toEqual({
                duration: 250,
                detail: markDetail,
            });
        });

        it('should clear the mark after measuring', () => {
            mockPerformance.getEntriesByName.mockReturnValue([
                { name: `${APPLY_LABEL_MARK_PREFIX}element-123`, startTime: 500, detail: {} },
            ]);

            getApplyLocationTracker().measure('element-123');

            expect(mockPerformance.clearMarks).toHaveBeenCalledWith(`${APPLY_LABEL_MARK_PREFIX}element-123`);
        });
    });

    describe('cleanup', () => {
        it('should clear old marks', async () => {
            const oldMark = {
                name: `${APPLY_LABEL_MARK_PREFIX}old-element`,
                startTime: 0,
            };

            mockPerformance.now.mockReturnValue(MINUTE + 100);
            mockPerformance.getEntriesByType.mockReturnValue([oldMark]);

            const element = { ID: 'new-element' } as Element;

            getApplyLocationTracker().mark({
                elements: [element],
                actionType: 'move',
                sourceLabelID: 'inbox',
                destinationLabelID: 'trash',
                conversationMode: false,
                isCategoryViewEnabled: false,
            });

            await new Promise<void>((resolve) => queueMicrotask(resolve));

            expect(mockPerformance.clearMarks).toHaveBeenCalledWith(`${APPLY_LABEL_MARK_PREFIX}old-element`);
        });

        it('should not clear new marks', async () => {
            const recentMark = {
                name: `${APPLY_LABEL_MARK_PREFIX}recent-element`,
                startTime: 900,
            };

            mockPerformance.now.mockReturnValue(1000);
            mockPerformance.getEntriesByType.mockReturnValue([recentMark]);

            const element = { ID: 'new-element' } as Element;

            mockPerformance.clearMarks.mockClear();

            getApplyLocationTracker().mark({
                elements: [element],
                actionType: 'move',
                sourceLabelID: 'inbox',
                destinationLabelID: 'trash',
                conversationMode: false,
                isCategoryViewEnabled: false,
            });

            await new Promise<void>((resolve) => queueMicrotask(resolve));

            expect(mockPerformance.clearMarks).toHaveBeenCalledWith(`${APPLY_LABEL_MARK_PREFIX}new-element`);
            expect(mockPerformance.clearMarks).not.toHaveBeenCalledWith(`${APPLY_LABEL_MARK_PREFIX}recent-element`);
        });

        it('should only clear marks with the correct prefix', async () => {
            const otherMark = {
                name: 'some-other-mark',
                startTime: 0,
            };

            mockPerformance.now.mockReturnValue(MINUTE + 100);
            mockPerformance.getEntriesByType.mockReturnValue([otherMark]);

            const element = { ID: 'new-element' } as Element;

            mockPerformance.clearMarks.mockClear();

            getApplyLocationTracker().mark({
                elements: [element],
                actionType: 'move',
                sourceLabelID: 'inbox',
                destinationLabelID: 'trash',
                conversationMode: false,
                isCategoryViewEnabled: false,
            });

            await new Promise<void>((resolve) => queueMicrotask(resolve));

            expect(mockPerformance.clearMarks).not.toHaveBeenCalledWith('some-other-mark');
        });
    });
});
