import type { ReactNode } from 'react';

import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { CreateNotificationOptions } from '@proton/app-context/notifications/interfaces';
import type { NotificationsManager } from '@proton/app-context/notifications/manager';
import { NotificationsContext } from '@proton/app-context/notifications/notificationsContext';
import { useNotifications } from '@proton/app-context/useNotifications';
import { IcExclamationCircle } from '@proton/icons/icons/IcExclamationCircle';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';

import { MeetNotificationsProvider } from './MeetNotificationsProvider';

const renderMeetNotifications = () => {
    const createNotification = vi.fn<(options: CreateNotificationOptions) => number>(() => 1);
    const parentManager = { createNotification, hideNotification: vi.fn() } as unknown as NotificationsManager;

    const wrapper = ({ children }: { children: ReactNode }) => (
        <NotificationsContext.Provider value={parentManager}>
            <MeetNotificationsProvider>{children}</MeetNotificationsProvider>
        </NotificationsContext.Provider>
    );

    const { result } = renderHook(() => useNotifications(), { wrapper });
    return { manager: result.current, createNotification, parentManager };
};

describe('MeetNotificationsProvider', () => {
    it.each(['error', 'warning'] as const)('gives %s notifications the exclamation circle icon', (type) => {
        const { manager, createNotification } = renderMeetNotifications();

        manager.createNotification({ type, text: 'Something failed' });

        expect(createNotification).toHaveBeenCalledWith({ type, text: 'Something failed', icon: IcExclamationCircle });
    });

    it.each(['info', 'success', undefined] as const)('gives %s notifications no icon', (type) => {
        const { manager, createNotification } = renderMeetNotifications();

        manager.createNotification({ type, text: 'Done' });

        expect(createNotification.mock.calls[0][0].icon).toBeUndefined();
    });

    it('keeps an icon the caller passes', () => {
        const { manager, createNotification } = renderMeetNotifications();

        manager.createNotification({ type: 'error', text: 'Something failed', icon: IcInfoCircle });

        expect(createNotification.mock.calls[0][0].icon).toBe(IcInfoCircle);
    });

    it('passes the other manager methods through', () => {
        const { manager, parentManager } = renderMeetNotifications();

        expect(manager.hideNotification).toBe(parentManager.hideNotification);
    });
});
