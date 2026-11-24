import { vi } from 'vitest';

import type { useNotifications } from '@proton/app-context/useNotifications';

export const mockNotifications: ReturnType<typeof useNotifications> = {
    createNotification: vi.fn() as any,
    removeNotification: vi.fn(),
    removeDuplicate: vi.fn(),
    hideNotification: vi.fn(),
    clearNotifications: vi.fn(),
    setOffset: vi.fn(),
};
