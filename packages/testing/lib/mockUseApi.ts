import * as useApiModule from '@proton/components/hooks/useApi';

jest.mock('@proton/components/hooks/useApi', () => ({
    __esModule: true,
    ...jest.requireActual('@proton/components/hooks/useApi'),
}));

export const mockUseApi = (value?: ReturnType<typeof useApiModule.default>) => {
    const mockedUseApi = jest.spyOn(useApiModule, 'default');

    mockedUseApi.mockReturnValue(value ?? jest.fn());

    return mockedUseApi;
};
