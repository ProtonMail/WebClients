// Package import so jest.spyOn matches modules resolved through @proton/app-context in consumers.
// eslint-disable-next-line custom-rules/no-package-self-import, import/no-extraneous-dependencies -- jest module identity
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
