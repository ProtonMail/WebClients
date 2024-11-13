import type { ReactNode } from 'react';
import { useEffect } from 'react';

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { ModalOwnProps } from '@proton/components';
import { ConfigProvider, NotificationsProvider } from '@proton/components';
import type { ApiEvent, ApiListenerCallback, ApiWithListener } from '@proton/shared/lib/api/createApi';

import type { AuthModalProps } from '../password/AuthModal';
import ApiModals from './ApiModals';
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
                        onClick={() => {
                            props.onSuccess?.('hv-success');
                            props.onClose?.();
                        }}
                    >
                        verify
                    </button>
                    <button
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
                        onClick={() => {
                            props.onSuccess?.({ response: 'success-test-result' } as any);
                            props.onClose?.();
                        }}
                    >
                        reauth
                    </button>
                    <button
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
        listeners.forEach((listener) => listener(event));
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
