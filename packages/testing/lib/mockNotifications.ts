import { jest } from '@jest/globals';
import { useNotifications } from '@proton/components';

export const mockNotifications: ReturnType<typeof useNotifications> = {
    createNotification: jest.fn<any>(),
    removeNotification: jest.fn(),
    hideNotification: jest.fn(),
    clearNotifications: jest.fn(),
};
