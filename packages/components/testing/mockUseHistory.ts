import * as reactRouterDomModule from 'react-router-dom';

// A simple workaround for jest issue not solved yet
// https://stackoverflow.com/questions/67872622/jest-spyon-not-working-on-index-file-cannot-redefine-property
jest.mock('react-router-dom', () => {
    return {
        __esModule: true,
        ...jest.requireActual('react-router-dom'),
    };
});

export const mockUseHistory = (value?: Partial<ReturnType<typeof reactRouterDomModule.useHistory>>) => {
    const mockedUseHistory = jest.spyOn(reactRouterDomModule, 'useHistory');

    mockedUseHistory.mockReturnValue({
        length: 0,
        action: 'PUSH',
        location: {
            pathname: '/',
            search: '',
            state: {},
            hash: '',
        },
        push: jest.fn(),
        replace: jest.fn(),
        go: jest.fn(),
        goBack: jest.fn(),
        goForward: jest.fn(),
        block: jest.fn(),
        listen: jest.fn(),
        createHref: jest.fn(),
        ...value,
    });

    return mockedUseHistory;
};
