import { act, renderHook, waitFor } from '@testing-library/react';

import { PAYMENT_METHOD_TYPES, PAYMENT_TOKEN_STATUS } from '@proton/payments/core/constants';
import type { PaymentVerificatorV5 } from '@proton/payments/core/createPaymentToken';
import type { AmountAndCurrency, ChargebeeIframeHandles } from '@proton/payments/core/interface';
import { apiMock } from '@proton/test-api/api';

import {
    getMockedEvents,
    getMockedWalletHandles,
    mockPaymentIntent,
    mockTokenStatus,
} from './__mocks__/wallet-test-helpers';
import { type GooglePayModalHandles, useGooglePay } from './useGooglePay';

const amountAndCurrency: AmountAndCurrency = { Amount: 1000, Currency: 'USD' };

const getModalHandles = (): GooglePayModalHandles => ({
    onAuthorize: jest.fn(),
    onClick: jest.fn(),
    onFailure: jest.fn(),
    onCancel: jest.fn(),
    on3DSChallenge: jest.fn(),
    onInitialize: jest.fn(),
});

const renderGooglePay = ({
    handles = getMockedWalletHandles(),
    iframeLoaded = true,
    verifyPayment = jest.fn().mockResolvedValue({ PaymentToken: 'token', v: 5 }) as unknown as PaymentVerificatorV5,
}: {
    handles?: ChargebeeIframeHandles;
    iframeLoaded?: boolean;
    verifyPayment?: PaymentVerificatorV5;
} = {}) => {
    const { events, fire, isSubscribed, removed } = getMockedEvents();
    const googlePayModalHandles = getModalHandles();
    const onChargeable = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
        useGooglePay(
            { amountAndCurrency, onChargeable },
            { api: apiMock, handles, events, googlePayModalHandles, verifyPayment }
        )
    );

    result.current.googlePayIframeLoadedRef.current = iframeLoaded;

    return { result, handles, googlePayModalHandles, onChargeable, verifyPayment, fire, isSubscribed, removed };
};

const initialize = async (run: (signal: AbortSignal) => Promise<void>) => {
    await act(async () => {
        await run(new AbortController().signal);
    });
};

const initialized = async (rendered: ReturnType<typeof renderGooglePay>) => {
    await initialize(rendered.result.current.initialize);
    await waitFor(() => expect(rendered.result.current.initializing).toBe(false));
    return rendered;
};

describe('useGooglePay', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockPaymentIntent();
        mockTokenStatus(PAYMENT_TOKEN_STATUS.CHARGEABLE);
    });

    it('reports itself as the google pay processor', () => {
        const { result } = renderGooglePay();
        expect(result.current.meta.type).toBe(PAYMENT_METHOD_TYPES.GOOGLE_PAY);
    });

    it('does nothing until the iframe has loaded', async () => {
        const { result, handles } = renderGooglePay({ iframeLoaded: false });

        await initialize(result.current.initialize);

        expect(handles.initializeGooglePay).not.toHaveBeenCalled();
        expect(apiMock).not.toHaveBeenCalled();
    });

    it('initializes, arms the payment intent and tells the modal', async () => {
        const rendered = renderGooglePay();
        await initialized(rendered);

        expect(rendered.handles.initializeGooglePay).toHaveBeenCalled();
        expect(rendered.handles.setGooglePayPaymentIntent).toHaveBeenCalled();
        expect(rendered.googlePayModalHandles.onInitialize).toHaveBeenCalled();
    });

    it('subscribes to the google pay events and the 3DS challenge', async () => {
        const rendered = renderGooglePay();
        await initialized(rendered);

        expect(rendered.isSubscribed('onGooglePayAuthorized')).toBe(true);
        expect(rendered.isSubscribed('onGooglePayClicked')).toBe(true);
        expect(rendered.isSubscribed('onGooglePayFailure')).toBe(true);
        expect(rendered.isSubscribed('onGooglePayCancelled')).toBe(true);
        expect(rendered.isSubscribed('onThreeDsChallenge')).toBe(true);
    });

    it('charges the token once authorized and the status is chargeable', async () => {
        const rendered = await initialized(renderGooglePay());

        await act(async () => {
            await rendered.fire('onGooglePayAuthorized');
        });

        expect(rendered.googlePayModalHandles.onAuthorize).toHaveBeenCalled();
        expect(rendered.onChargeable).toHaveBeenCalledWith(
            expect.objectContaining({ chargeable: true, type: PAYMENT_METHOD_TYPES.GOOGLE_PAY })
        );
    });

    it('reports a failure when the token is not chargeable after authorization', async () => {
        mockTokenStatus(PAYMENT_TOKEN_STATUS.PENDING);
        const rendered = await initialized(renderGooglePay());

        await act(async () => {
            await rendered.fire('onGooglePayAuthorized');
        });

        expect(rendered.onChargeable).not.toHaveBeenCalled();
        expect(rendered.googlePayModalHandles.onFailure).toHaveBeenCalled();
    });

    it('charges only once even if authorization fires twice', async () => {
        const rendered = await initialized(renderGooglePay());

        await act(async () => {
            await rendered.fire('onGooglePayAuthorized');
            await rendered.fire('onGooglePayAuthorized');
        });

        expect(rendered.onChargeable).toHaveBeenCalledTimes(1);
    });

    describe('3DS challenge', () => {
        it('verifies the payment and then charges', async () => {
            const rendered = await initialized(renderGooglePay());

            await act(async () => {
                await rendered.fire('onThreeDsChallenge', { url: 'https://3ds.example' });
            });

            expect(rendered.googlePayModalHandles.on3DSChallenge).toHaveBeenCalled();
            expect(rendered.verifyPayment).toHaveBeenCalledWith(
                expect.objectContaining({
                    token: expect.objectContaining({ approvalUrl: 'https://3ds.example', authorized: false }),
                    paymentMethodType: PAYMENT_METHOD_TYPES.GOOGLE_PAY,
                })
            );
            expect(rendered.onChargeable).toHaveBeenCalledWith(expect.objectContaining({ chargeable: true }));
        });

        it('does not charge when verification rejects', async () => {
            const verifyPayment = jest
                .fn()
                .mockRejectedValue(new Error('3ds failed')) as unknown as PaymentVerificatorV5;
            const rendered = await initialized(renderGooglePay({ verifyPayment }));

            await act(async () => {
                await rendered.fire('onThreeDsChallenge', { url: 'https://3ds.example' });
            });

            expect(rendered.onChargeable).not.toHaveBeenCalled();
        });

        it('charges only once when the challenge and authorization both resolve', async () => {
            const rendered = await initialized(renderGooglePay());

            await act(async () => {
                await rendered.fire('onThreeDsChallenge', { url: 'https://3ds.example' });
                await rendered.fire('onGooglePayAuthorized');
            });

            expect(rendered.onChargeable).toHaveBeenCalledTimes(1);
        });

        // verifyPayment consumes the authorized event itself to finish, so racing it here used to
        // abort it and report a cancellation for a payment that in fact succeeded
        it('does not report a cancellation when authorization lands mid-verification', async () => {
            let resolveVerification: (token: unknown) => void = () => {};
            const verifyPayment = jest.fn(
                () => new Promise((resolve) => (resolveVerification = resolve))
            ) as unknown as PaymentVerificatorV5;
            const rendered = await initialized(renderGooglePay({ verifyPayment }));

            await act(async () => {
                void rendered.fire('onThreeDsChallenge', { url: 'https://3ds.example' });
            });

            await act(async () => {
                await rendered.fire('onGooglePayAuthorized');
            });

            // verification owns the outcome, so nothing may be reported until it resolves
            expect(rendered.onChargeable).not.toHaveBeenCalled();

            await act(async () => {
                resolveVerification({ PaymentToken: 'token', v: 5 });
            });

            expect(rendered.onChargeable).toHaveBeenCalledTimes(1);
            expect(rendered.googlePayModalHandles.onCancel).not.toHaveBeenCalled();
        });

        // the authorized event may be missed entirely; verification is the authority on chargeability
        // and performs its own status check, so a PENDING status here must not block the charge
        it('charges on verification alone when the authorized event never arrives', async () => {
            mockTokenStatus(PAYMENT_TOKEN_STATUS.PENDING);
            const rendered = await initialized(renderGooglePay());

            await act(async () => {
                await rendered.fire('onThreeDsChallenge', { url: 'https://3ds.example' });
            });

            expect(rendered.onChargeable).toHaveBeenCalledTimes(1);
            expect(rendered.googlePayModalHandles.onFailure).not.toHaveBeenCalled();
        });
    });

    it('re-initializes after a failure', async () => {
        const rendered = await initialized(renderGooglePay());
        const initializeCallsBefore = (rendered.handles.initializeGooglePay as jest.Mock).mock.calls.length;

        const error = new Error('declined');
        await act(async () => {
            await rendered.fire('onGooglePayFailure', error);
        });

        expect(rendered.googlePayModalHandles.onFailure).toHaveBeenCalledWith(error);
        await waitFor(() =>
            expect((rendered.handles.initializeGooglePay as jest.Mock).mock.calls.length).toBeGreaterThan(
                initializeCallsBefore
            )
        );
    });

    it.each([
        ['onGooglePayClicked', 'onClick'],
        ['onGooglePayCancelled', 'onCancel'],
    ] as const)('forwards %s to the modal', async (event, handle) => {
        const rendered = await initialized(renderGooglePay());

        await act(async () => {
            await rendered.fire(event);
        });

        expect(rendered.googlePayModalHandles[handle]).toHaveBeenCalled();
    });

    it('removes its listeners on reset', async () => {
        const rendered = await initialized(renderGooglePay());

        act(() => rendered.result.current.reset());

        expect(rendered.removed).toEqual(
            expect.arrayContaining([
                'onGooglePayAuthorized',
                'onThreeDsChallenge',
                'onGooglePayClicked',
                'onGooglePayFailure',
                'onGooglePayCancelled',
            ])
        );
    });

    it('stops listening for authorization after a reset', async () => {
        const rendered = await initialized(renderGooglePay());

        act(() => rendered.result.current.reset());

        expect(rendered.isSubscribed('onGooglePayAuthorized')).toBe(false);
    });

    // the facade resets the hook when the downstream action fails, so a reset has to re-arm the
    // button rather than leaving it permanently deduped
    it('can report chargeable again after a reset', async () => {
        const rendered = await initialized(renderGooglePay());

        await act(async () => {
            await rendered.fire('onGooglePayAuthorized');
        });

        act(() => rendered.result.current.reset());
        await initialized(rendered);

        await act(async () => {
            await rendered.fire('onGooglePayAuthorized');
        });

        expect(rendered.onChargeable).toHaveBeenCalledTimes(2);
    });
});
