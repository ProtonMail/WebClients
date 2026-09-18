import type { ReactNode } from 'react';
import { useEffect } from 'react';

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { ApiEvent, ApiListenerCallback, ApiWithListener } from '@proton/shared/lib/api/createApi';

import type { ModalOwnProps } from '../..';
import { ConfigProvider, NotificationsProvider } from '../..';
import type { AuthModalProps } from '../password/AuthModal';
import ApiModals from './ApiModals';
import ApiModalsHV from './ApiModalsHV';
import type { HumanVerificationModalProps } from './humanVerification/HumanVerificationModal';

const Wrap = ({ children }: { children: ReactNode }) => {
    return (
        <ConfigProvider config={{} as any}>
            <NotificationsProvider>{children}</NotificationsProvider>
        </ConfigProvider>
    );
};

const MockedModal = (props: Pick<ModalOwnProps, 'onExit' | 'open'> & { children: ReactNode }) => {
    useEffect(() => {
        if (!props.open) {
            props.onExit?.();
        }
    }, [props.open]);

    return <div>{props.children}</div>;
};

jest.mock('./humanVerification/HumanVerificationModal', () => {
    return {
        __esModule: true,
        default: (props: HumanVerificationModalProps<any>) => {
            return (
                <MockedModal {...props}>
                    <h1>{props.token}</h1>
                    <button
                        type="button"
                        onClick={() => {
                            void props.api({ url: 'send-code' });
                        }}
                    >
                        send-code
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            props.onSuccess?.('hv-success');
                            props.onClose?.();
                        }}
                    >
                        verify
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            props.onClose?.();
                        }}
                    >
                        cancel
                    </button>
                </MockedModal>
            );
        },
    };
});

jest.mock('../password/AuthModal', () => {
    return {
        __esModule: true,
        default: (props: AuthModalProps) => {
            return (
                <MockedModal {...props}>
                    <button
                        type="button"
                        onClick={() => {
                            void props.onSuccess?.({ response: 'success-test-result' } as any);
                            props.onClose?.();
                        }}
                    >
                        reauth
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            props.onCancel?.();
                            props.onClose?.();
                        }}
                    >
                        cancel
                    </button>
                </MockedModal>
            );
        },
    };
});

const createApi = () => {
    const listeners: ApiListenerCallback[] = [];

    const api = Object.assign(jest.fn(), {
        addEventListener: (cb: ApiListenerCallback) => {
            listeners.push(cb);
        },
        removeEventListener: (cb: ApiListenerCallback) => {
            listeners.splice(listeners.indexOf(cb), 1);
        },
    }) as any as ApiWithListener;

    const notify = (event: ApiEvent) => {
        return listeners.map((listener) => listener(event)).some((value) => value === true);
    };

    return {
        api,
        listeners,
        notify,
    };
};

describe('ApiModals', () => {
    test('should display a missing scopes modal and resolve a promise', async () => {
        const { api, notify } = createApi();

        render(
            <Wrap>
                <ApiModals api={api} />
            </Wrap>
        );

        const promise = new Promise((resolve, reject) => {
            notify({
                type: 'missing-scopes',
                payload: {
                    scopes: ['password'],
                    error: new Error('test'),
                    options: {},
                    resolve,
                    reject,
                },
            });
        });
        await Promise.all([
            userEvent.click(await screen.findByText('reauth')),
            expect(promise).resolves.toBe('success-test-result'),
        ]);

        expect(screen.queryByText('reauth')).not.toBeInTheDocument();
    });

    test('should display a missing scopes modal and reject a promise', async () => {
        const { api, notify } = createApi();

        render(
            <Wrap>
                <ApiModals api={api} />
            </Wrap>
        );

        const error = new Error('test');
        const promise = new Promise((resolve, reject) => {
            notify({
                type: 'missing-scopes',
                payload: {
                    scopes: ['password'],
                    error,
                    options: {},
                    resolve,
                    reject,
                },
            });
        });

        await Promise.all([userEvent.click(await screen.findByText('cancel')), expect(promise).rejects.toThrow(error)]);

        expect(screen.queryByText('reauth')).not.toBeInTheDocument();
    });

    test('should sequentially display missing scopes modals and resolve them after each other', async () => {
        const { api, notify } = createApi();

        render(
            <Wrap>
                <ApiModals api={api} />
            </Wrap>
        );

        const promise1 = new Promise((resolve, reject) => {
            notify({
                type: 'missing-scopes',
                payload: {
                    scopes: ['password'],
                    error: new Error('test'),
                    options: {},
                    resolve,
                    reject,
                },
            });
        });
        const error2 = new Error('test 2');
        const promise2 = new Promise((resolve, reject) => {
            notify({
                type: 'missing-scopes',
                payload: {
                    scopes: ['password'],
                    error: error2,
                    options: {},
                    resolve,
                    reject,
                },
            });
        });
        await Promise.all([
            userEvent.click(await screen.findByText('reauth')),
            expect(promise1).resolves.toBe('success-test-result'),
        ]);

        await Promise.all([
            userEvent.click(await screen.findByText('cancel')),
            expect(promise2).rejects.toThrow(error2),
        ]);
    });

    test('should sequentially display human verification modals and resolve them after each other', async () => {
        const { api, notify } = createApi();

        render(
            <Wrap>
                <ApiModals api={api} />
            </Wrap>
        );

        const promise1 = new Promise((resolve, reject) => {
            notify({
                type: 'handle-verification',
                payload: {
                    token: 'token-1',
                    methods: ['1'],
                    onVerify: async () => true,
                    title: '',
                    error: new Error('test'),
                    resolve,
                    reject,
                },
            });
        });
        const error2 = new Error('test 2');
        const promise2 = new Promise((resolve, reject) => {
            notify({
                type: 'handle-verification',
                payload: {
                    token: 'token-2',
                    methods: ['1'],
                    onVerify: async () => true,
                    title: '',
                    error: error2,
                    resolve,
                    reject,
                },
            });
        });

        expect(await screen.findByText('token-1'));
        expect(screen.queryByText('token-2')).not.toBeInTheDocument();
        await Promise.all([
            userEvent.click(await screen.findByText('verify')),
            expect(promise1).resolves.toBe('hv-success'),
        ]);

        expect(await screen.findByText('token-2'));
        expect(screen.queryByText('token-1')).not.toBeInTheDocument();
        await Promise.all([
            userEvent.click(await screen.findByText('cancel')),
            expect(promise2).rejects.toThrow(error2),
        ]);
    });
});

describe('ApiModalsHV', () => {
    test('should answer a challenge on the session that emitted it', async () => {
        const { api, notify } = createApi();
        const sessionApi = jest.fn();

        render(
            <Wrap>
                <ApiModalsHV api={sessionApi} events={api} />
            </Wrap>
        );

        const handled = notify({
            type: 'handle-verification',
            payload: {
                token: 'token-1',
                methods: ['1'],
                onVerify: async () => true,
                title: '',
                error: new Error('test'),
                resolve: () => {},
                reject: () => {},
            },
        });

        expect(handled).toBe(true);
        expect(await screen.findByText('token-1'));
        await userEvent.click(await screen.findByText('send-code'));
        expect(sessionApi).toHaveBeenCalledWith({ url: 'send-code' });
        expect(api).not.toHaveBeenCalled();
    });

    test('should reject an open challenge when unmounted', async () => {
        const { api, notify } = createApi();
        const error: any = new Error('test');
        const reject = jest.fn();

        const { unmount } = render(
            <Wrap>
                <ApiModalsHV api={jest.fn()} events={api} />
            </Wrap>
        );

        notify({
            type: 'handle-verification',
            payload: {
                token: 'token-1',
                methods: ['1'],
                onVerify: async () => true,
                title: '',
                error,
                resolve: () => {},
                reject,
            },
        });

        expect(await screen.findByText('token-1'));

        unmount();

        expect(reject).toHaveBeenCalledWith(error);
        expect(error.cancel).toBe(true);
    });

    test('should decline payment challenges', () => {
        const { api, notify } = createApi();

        render(
            <Wrap>
                <ApiModalsHV api={jest.fn()} events={api} />
            </Wrap>
        );

        const handled = notify({
            type: 'handle-verification',
            payload: {
                token: 'token-1',
                methods: ['payment'],
                onVerify: async () => true,
                title: '',
                error: new Error('test'),
                resolve: () => {},
                reject: () => {},
            },
        });

        expect(handled).toBe(false);
        expect(screen.queryByText('token-1')).not.toBeInTheDocument();
    });
});
