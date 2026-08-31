import * as useEventManagerModule from '../hooks/useEventManager';

jest.mock('../hooks/useEventManager', () => ({
    __esModule: true,
    ...jest.requireActual('../hooks/useEventManager'),
}));

export const mockUseEventManager = (value?: Partial<ReturnType<typeof useEventManagerModule.default>>) => {
    const mockedUseEventManager = jest.spyOn(useEventManagerModule, 'default');

    mockedUseEventManager.mockReturnValue({
        setEventID: jest.fn(),
        getEventID: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        call: jest.fn(),
        reset: jest.fn(),
        subscribe: jest.fn(),
        ...value,
    });

    return mockedUseEventManager;
};
