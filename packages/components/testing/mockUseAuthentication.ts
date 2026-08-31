import * as useAuthenticationModule from '../hooks/useAuthentication';

jest.mock('../hooks/useAuthentication', () => ({
    __esModule: true,
    ...jest.requireActual('../hooks/useAuthentication'),
}));

export const mockUseAuthentication = (value: ReturnType<typeof useAuthenticationModule.default>) => {
    const mockedUseApi = jest.spyOn(useAuthenticationModule, 'default');

    mockedUseApi.mockReturnValue(value);

    return mockedUseApi;
};
