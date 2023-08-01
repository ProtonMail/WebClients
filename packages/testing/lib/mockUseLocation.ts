import * as reactRouterDomModule from 'react-router-dom';

// A simple workaround for jest issue not solved yet
// https://stackoverflow.com/questions/67872622/jest-spyon-not-working-on-index-file-cannot-redefine-property
jest.mock('react-router-dom', () => {
    return {
        __esModule: true,
        ...jest.requireActual('react-router-dom'),
    };
});

export const mockUseLocation = (value?: Partial<ReturnType<typeof reactRouterDomModule.useLocation>>) => {
    const mockedUseLocation = jest.spyOn(reactRouterDomModule, 'useLocation');

    mockedUseLocation.mockReturnValue({
        pathname: '/',
        search: '',
        state: {},
        hash: '',
        ...value,
    });

    return mockedUseLocation;
};
