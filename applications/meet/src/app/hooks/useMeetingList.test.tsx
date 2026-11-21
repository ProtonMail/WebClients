import { type ReactNode, useState } from 'react';

import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { CreateNotificationOptions, Notification } from '@proton/app-context/notifications/interfaces';
import createNotificationManager from '@proton/app-context/notifications/manager';
import type { Meeting } from '@proton/shared/lib/interfaces/Meet';

import { useMeetingList } from './useMeetingList';

const mocks = vi.hoisted(() => ({
    createNotification: vi.fn((_options: CreateNotificationOptions) => 1),
    createMeeting: vi.fn(),
    activeMeetings: [] as Meeting[],
}));

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: mocks.createNotification }),
}));
vi.mock('@proton/meet/hooks/useCreateMeeting', () => ({
    useCreateMeeting: () => ({ createMeeting: mocks.createMeeting }),
}));
vi.mock('@proton/meet/hooks/useGetMeetingDependencies', () => ({
    useGetMeetingDependencies: () => vi.fn(),
}));
vi.mock('@proton/meet/store/hooks/useMeetings', () => ({
    useGetMeetings: () => vi.fn(),
    useMeetings: () => [mocks.activeMeetings, false],
}));
vi.mock('./useRotatePersonalMeetingLink', () => ({
    useRotatePersonalMeetingLink: () => ({ rotatePersonalMeeting: vi.fn() }),
}));

describe('useMeetingList', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    it('shows a persistent error with a Refresh page button that reloads when the personal meeting cannot be created', async () => {
        const reload = vi.fn();
        vi.stubGlobal('location', { ...window.location, reload });
        mocks.createMeeting.mockRejectedValue(new Error('create failed'));

        renderHook(() => useMeetingList());

        await waitFor(() => expect(mocks.createNotification).toHaveBeenCalledTimes(1));

        const [notification] = mocks.createNotification.mock.calls[0];
        expect(notification.type).toBe('error');
        expect(notification.expiration).toBe(-1);

        render(<>{notification.text as ReactNode}</>);
        expect(screen.getByText('Personal meeting not created. Refresh the page to try again.')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Refresh page' }));
        expect(reload).toHaveBeenCalledTimes(1);
    });

    it('keeps a single error toast when the personal meeting creation fails again after a meetings refresh', async () => {
        mocks.createMeeting.mockRejectedValue(new Error('create failed'));

        const { rerender } = renderHook(() => useMeetingList());
        await waitFor(() => expect(mocks.createNotification).toHaveBeenCalledTimes(1));

        mocks.activeMeetings = [];
        rerender();
        await waitFor(() => expect(mocks.createNotification).toHaveBeenCalledTimes(2));

        const { result: notificationsState } = renderHook(() => useState<Notification[]>([]));
        const manager = createNotificationManager(notificationsState.current[1], vi.fn());
        act(() => {
            mocks.createNotification.mock.calls.forEach(([options]) => manager.createNotification(options));
        });

        expect(notificationsState.current[0]).toHaveLength(1);
    });
});
