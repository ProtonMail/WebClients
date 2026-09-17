import { vi } from 'vitest';

import * as useNotificationsModule from '@proton/app-context/useNotifications';

export const mockUseNotifications = (value?: Partial<ReturnType<typeof useNotificationsModule.useNotifications>>) => {
    const mockedUseNotifications = vi.spyOn(useNotificationsModule, 'useNotifications');

    mockedUseNotifications.mockReturnValue({
        setOffset: vi.fn(),
        removeDuplicate: vi.fn(),
        createNotification: vi.fn(),
        removeNotification: vi.fn(),
        hideNotification: vi.fn(),
        clearNotifications: vi.fn(),
        ...value,
    });

    return mockedUseNotifications;
};
