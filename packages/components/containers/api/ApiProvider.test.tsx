import { render } from '@testing-library/react';

import { apiStatusActions } from '@proton/account/apiStatus';
import { mockUseNotifications } from '@proton/app-context/testing/vitest/mockUseNotifications';
import { ProtonStoreProvider } from '@proton/redux-shared-store/sharedProvider';
import type { ApiListenerCallback, ApiWithListener } from '@proton/shared/lib/api/createApi';

import { extendStore, setupStore } from '../../testing/vitest/store';
import ApiProvider from './ApiProvider';

const dispatchMock = vi.fn();
vi.mock('@proton/app-context/useConfig', () => ({
    useConfig: () => ({ APP_NAME: 'proton-mail', APP_VERSION: 'test' }),
}));
vi.mock('./ApiModals', () => ({
    __esModule: true,
    default: () => null,
}));
vi.mock('../../hooks/useAuthentication', () => ({ __esModule: true, default: vi.fn() }));
vi.mock('@proton/redux-shared-store/sharedProvider', async () => {
    return {
        ...(await vi.importActual('@proton/redux-shared-store/sharedProvider')),
        useDispatch: () => dispatchMock,
    };
});
vi.mock('@proton/shared/lib/authentication/logout', () => ({
    handleInvalidSession: () => undefined,
}));

const setupTest = (apiMock: ApiWithListener) => {
    const store = setupStore({
        preloadedState: {},
    });

    function Wrapper({ children }: { children: React.ReactNode }) {
        return <ProtonStoreProvider store={store}>{children}</ProtonStoreProvider>;
    }

    const { container } = render(<ApiProvider api={apiMock} children={null} />, {
        wrapper: Wrapper,
    });

    extendStore({
        api: apiMock,
    });

    return {
        container,
        store,
    };
};

describe('ApiProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('ApiStatus', () => {
        it('should update status', async () => {
            mockUseNotifications();

            const listenerMockFn = vi.fn();
            const listeners: Function[] = [listenerMockFn];
            const api = Object.assign(
                (type: 'status' | 'notification' | 'server-time') => {
                    listeners.forEach((listener) => listener({ type }));
                },
                {
                    addEventListener: (cb: ApiListenerCallback) => {
                        listeners.push(cb);
                    },
                    removeEventListener: (cb: ApiListenerCallback) => {
                        listeners.splice(listeners.indexOf(cb), 1);
                    },
                }
            );

            const apiStatusMock = vi.fn();
            vi.spyOn(apiStatusActions, 'update').mockImplementation(apiStatusMock);

            setupTest(api as unknown as ApiWithListener);

            expect(listenerMockFn).toHaveBeenCalledTimes(0);
            expect(dispatchMock).toHaveBeenCalledTimes(0);
            await api('status');
            expect(dispatchMock).toHaveBeenCalledTimes(1);
            expect(listenerMockFn).toHaveBeenCalledTimes(1);
        });
    });
});
