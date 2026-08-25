import * as useNotificationsModule from '@proton/app-context/useNotifications';

jest.mock('@proton/app-context/useNotifications', () => ({
    __esModule: true,
    ...jest.requireActual('@proton/app-context/useNotifications'),
}));

export const mockUseNotifications = (value?: Partial<ReturnType<typeof useNotificationsModule.useNotifications>>) => {
    const mockedUseNotifications = jest.spyOn(useNotificationsModule, 'useNotifications');

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
