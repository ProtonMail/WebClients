import * as reactRouterDomModule from 'react-router-dom';

import { vi } from 'vitest';

vi.mock('react-router-dom', async () => {
    return {
        __esModule: true,
        ...(await vi.importActual('react-router-dom')),
    };
});

export const mockUseLocation = (value?: Partial<ReturnType<typeof reactRouterDomModule.useLocation>>) => {
    const mockedUseLocation = vi.spyOn(reactRouterDomModule, 'useLocation');

    mockedUseLocation.mockReturnValue({
        pathname: '/',
        search: '',
        state: {},
        hash: '',
        ...value,
    });

    return mockedUseLocation;
};
