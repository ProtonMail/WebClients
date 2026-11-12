import { vi } from 'vitest';

// Package import so vi.spyOn matches modules resolved through @proton/app-context in consumers.
// eslint-disable-next-line custom-rules/no-package-self-import, proton/no-extraneous-dependencies -- vitest module identity
import * as useApiModule from '@proton/app-context/useApi';

export const mockUseApi = (value?: ReturnType<typeof useApiModule.useApi>) => {
    const mockedUseApi = vi.spyOn(useApiModule, 'useApi');

    mockedUseApi.mockReturnValue(value ?? vi.fn());

    return mockedUseApi;
};
