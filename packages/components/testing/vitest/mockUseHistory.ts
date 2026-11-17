import * as reactRouterDomModule from 'react-router-dom';

import { vi } from 'vitest';

vi.mock('react-router-dom', async () => {
    return {
        __esModule: true,
        ...(await vi.importActual('react-router-dom')),
    };
});

export const mockUseHistory = (value?: Partial<ReturnType<typeof reactRouterDomModule.useHistory>>) => {
    const mockedUseHistory = vi.spyOn(reactRouterDomModule, 'useHistory');

    mockedUseHistory.mockReturnValue({
        length: 0,
        action: 'PUSH',
        location: {
            pathname: '/',
            search: '',
            state: {},
            hash: '',
        },
        push: vi.fn(),
        replace: vi.fn(),
        go: vi.fn(),
        goBack: vi.fn(),
        goForward: vi.fn(),
        block: vi.fn(),
        listen: vi.fn(),
        createHref: vi.fn(),
        ...value,
    });

    return mockedUseHistory;
};
