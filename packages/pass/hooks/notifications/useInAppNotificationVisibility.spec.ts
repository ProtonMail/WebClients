import { renderHook, waitFor } from '@testing-library/react';

import { InAppNotificationDisplayType, InAppNotificationState } from '@proton/pass/types';
import type { InAppNotification } from '@proton/pass/types/data/notification';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import * as busy from '@proton/shared/lib/busy';

import { useInAppNotificationVisibility } from './useInAppNotificationVisibility';

jest.mock('@proton/shared/lib/busy', () => ({ isModalOpen: jest.fn() }));
const isModalOpen = busy.isModalOpen as jest.MockedFunction<typeof busy.isModalOpen>;

const createNotification = (displayType: InAppNotificationDisplayType): InAppNotification => {
    const id = uniqueId();
    return {
        id,
        notificationKey: `test-${id}`,
        state: InAppNotificationState.UNREAD,
        content: {
            displayType,
            title: 'Test',
            message: 'Message',
            imageUrl: null,
            cta: null,
            theme: null,
        },
        startTime: 0,
        endTime: 0,
        priority: 1,
        promoContents: null,
    };
};

describe('useInAppNotificationVisibility', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        isModalOpen.mockReturnValue(false);
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    test('should return `false` when no notification is provided', () => {
        const { result } = renderHook(() => useInAppNotificationVisibility(undefined));
        expect(result.current).toBe(false);
    });

    test('should return `true` for banner notifications immediately', async () => {
        const notification = createNotification(InAppNotificationDisplayType.BANNER);
        const { result } = renderHook(() => useInAppNotificationVisibility(notification));

        jest.runAllTimers();
        await waitFor(() => {
            expect(result.current).toBe(true);
        });
    });

    test('should return `true` for modal notifications when no modal is open', async () => {
        isModalOpen.mockReturnValue(false);

        const notification = createNotification(InAppNotificationDisplayType.MODAL);
        const { result } = renderHook(() => useInAppNotificationVisibility(notification));

        jest.runAllTimers();
        await waitFor(() => expect(result.current).toBe(true));

        expect(isModalOpen).toHaveBeenCalled();
    });

    test('should return `false` for modal notifications when a modal is already open', async () => {
        isModalOpen.mockReturnValue(true);

        const notification = createNotification(InAppNotificationDisplayType.MODAL);
        const { result } = renderHook(() => useInAppNotificationVisibility(notification));

        jest.runAllTimers();
        await waitFor(() => expect(isModalOpen).toHaveBeenCalled());

        expect(result.current).toBe(false);
    });

    test('should reset visibility to `false` when notification becomes null', async () => {
        const initialProps = createNotification(InAppNotificationDisplayType.BANNER);
        const { result, rerender } = renderHook(useInAppNotificationVisibility, { initialProps });

        jest.runAllTimers();
        await waitFor(() => expect(result.current).toBe(true));

        rerender(undefined);
        jest.runAllTimers();
        await waitFor(() => expect(result.current).toBe(false));
    });

    test('should maintain visibility `true` on new modal if modal notification is already visible', async () => {
        const initialProps = createNotification(InAppNotificationDisplayType.MODAL);
        const { result, rerender } = renderHook(useInAppNotificationVisibility, { initialProps });

        jest.runAllTimers();
        await waitFor(() => expect(result.current).toBe(true));
        expect(isModalOpen).toHaveBeenCalled();
        isModalOpen.mockClear();

        rerender(createNotification(InAppNotificationDisplayType.MODAL));
        jest.runAllTimers();
        expect(isModalOpen).not.toHaveBeenCalled();
        await waitFor(() => expect(result.current).toBe(true));
    });

    test('should properly cancel async operations when notification changes', async () => {
        const initialProps = createNotification(InAppNotificationDisplayType.MODAL);
        const { result, rerender } = renderHook(useInAppNotificationVisibility, { initialProps });

        rerender(createNotification(InAppNotificationDisplayType.BANNER));
        jest.runAllTimers();

        await waitFor(() => expect(result.current).toBe(true));
    });
});
