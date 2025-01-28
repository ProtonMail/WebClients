import * as useAuthenticationModule from '@proton/components/hooks/useAuthentication';

jest.mock('@proton/components/hooks/useAuthentication', () => ({
    __esModule: true,
    ...jest.requireActual('@proton/components/hooks/useAuthentication'),
}));

export const mockUseAuthentication = (value: ReturnType<typeof useAuthenticationModule.default>) => {
    const mockedUseApi = jest.spyOn(useAuthenticationModule, 'default');

    mockedUseApi.mockReturnValue(value);

    return mockedUseApi;
};
