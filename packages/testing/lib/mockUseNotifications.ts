import * as useNotificationsModule from '@proton/components/hooks/useNotifications';

export const mockUseNotifications = (value?: Partial<ReturnType<typeof useNotificationsModule.default>>) => {
    const mockedUseNotifications = jest.spyOn(useNotificationsModule, 'default');

    mockedUseNotifications.mockReturnValue({
        setOffset: jest.fn(),
        removeDuplicate: jest.fn(),
        createNotification: jest.fn(),
        removeNotification: jest.fn(),
        hideNotification: jest.fn(),
        clearNotifications: jest.fn(),
        ...value,
    });

    return mockedUseNotifications;
};
