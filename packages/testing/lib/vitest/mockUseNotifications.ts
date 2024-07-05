import { vi } from 'vitest';

import * as useNotificationsModule from '@proton/components/hooks/useNotifications';

export const mockUseNotifications = (value?: Partial<ReturnType<typeof useNotificationsModule.default>>) => {
    const mockedUseNotifications = vi.spyOn(useNotificationsModule, 'default');

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
