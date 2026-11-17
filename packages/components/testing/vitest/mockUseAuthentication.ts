import { vi } from 'vitest';

import * as useAuthenticationModule from '../../hooks/useAuthentication';

vi.mock('../../hooks/useAuthentication', async () => ({
    __esModule: true,
    ...(await vi.importActual('../../hooks/useAuthentication')),
}));

export const mockUseAuthentication = (value: ReturnType<typeof useAuthenticationModule.default>) => {
    const mockedUseApi = vi.spyOn(useAuthenticationModule, 'default');

    mockedUseApi.mockReturnValue(value);

    return mockedUseApi;
};
