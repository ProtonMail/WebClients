import * as useApiModule from '@proton/app-context/useApi';

jest.mock('@proton/app-context/useApi', () => ({
    __esModule: true,
    ...jest.requireActual('@proton/app-context/useApi'),
}));

export const mockUseApi = (value?: ReturnType<typeof useApiModule.useApi>) => {
    const mockedUseApi = jest.spyOn(useApiModule, 'useApi');

    mockedUseApi.mockReturnValue(value ?? jest.fn());

    return mockedUseApi;
};
