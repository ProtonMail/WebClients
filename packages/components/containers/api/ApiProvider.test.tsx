import { render } from '@testing-library/react';

import { apiStatusActions } from '@proton/account/apiStatus';
import { ProtonStoreProvider } from '@proton/redux-shared-store/sharedProvider';
import type { ApiListenerCallback, ApiWithListener } from '@proton/shared/lib/api/createApi';
import { extendStore, setupStore } from '@proton/testing/lib/context/store';
import { mockUseNotifications } from '@proton/testing/lib/mockUseNotifications';

import ApiProvider from './ApiProvider';

const dispatchMock = jest.fn();
jest.mock('@proton/components/hooks/useConfig', () => () => ({ APP_NAME: 'proton-mail', APP_VERSION: 'test' }));
jest.mock('./ApiModals', () => ({
    __esModule: true,
    default: () => null,
}));
jest.mock('@proton/components/hooks/useAuthentication', jest.fn);
jest.mock('@proton/redux-shared-store/sharedProvider', () => {
    return {
        ...jest.requireActual('@proton/redux-shared-store/sharedProvider'),
        useDispatch: () => dispatchMock,
    };
});
jest.mock('@proton/shared/lib/authentication/logout', () => ({
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
        jest.clearAllMocks();
    });
    describe('ApiStatus', () => {
        it('should update status', async () => {
            mockUseNotifications();

            const listenerMockFn = jest.fn();
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

            const apiStatusMock = jest.fn();
            jest.spyOn(apiStatusActions, 'update').mockImplementation(apiStatusMock);

            setupTest(api as unknown as ApiWithListener);

            expect(listenerMockFn).toHaveBeenCalledTimes(0);
            expect(dispatchMock).toHaveBeenCalledTimes(0);
            await api('status');
            expect(dispatchMock).toHaveBeenCalledTimes(1);
            expect(listenerMockFn).toHaveBeenCalledTimes(1);
        });
    });
});
