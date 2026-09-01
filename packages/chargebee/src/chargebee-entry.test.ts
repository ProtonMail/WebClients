import { fireEvent } from '@testing-library/dom';

import type { AuthorizedPaymentIntent, BinData, DirectDebitCustomer, PaymentIntent } from '../lib/types';
import { resetChargebee } from './chargebee';
import { FALLBACK_EMAIL, formatCustomer, initialize, toReportableError } from './chargebee-entry';
import { resetCheckpoints } from './checkpoints';
import type { DirectDebitSubmitEvent, GetHeightEvent, SetConfigurationEvent } from './message-bus';
import { getMessageBus } from './message-bus';

jest.mock('./ui-utils');

Object.defineProperty(window, 'location', {
    value: new URL('https://account-api.proton.me'),
    writable: true,
    configurable: true,
});

// jsdom does not dispatch `message` events for `window.parent.postMessage`, so route
// the parent-targeted messages back to the iframe window to observe responses. The
// dispatch is queued on the microtask queue so the response listener can register first.
window.parent.postMessage = ((data: any, targetOrigin?: string) => {
    queueMicrotask(() => {
        window.dispatchEvent(new MessageEvent('message', { data, origin: targetOrigin, source: window.parent }));
    });
}) as typeof window.parent.postMessage;

const createFieldMock = jest.fn().mockReturnValue({
    at: jest.fn().mockReturnValue({
        status: {
            isValid: true,
        },
    }),
    status: {
        isValid: true,
    },
});

const mountMock = jest.fn();
const onMock = jest.fn();
const getBinDataMock = jest.fn();

const authorizeWith3dsCatchMock = jest.fn();
const authorizeWith3dsThenMock = jest.fn().mockReturnValue({
    catch: authorizeWith3dsCatchMock,
});
const authorizeWith3dsMock = jest.fn().mockReturnValue({
    then: authorizeWith3dsThenMock,
});

const createComponentMock = jest.fn().mockReturnValue({
    createField: createFieldMock,
    mount: mountMock,
    on: onMock,
    getBinData: getBinDataMock,
    authorizeWith3ds: authorizeWith3dsMock,
});

const directDebitHandlerMock = {
    setPaymentIntent: jest.fn(),
    handlePayment: jest.fn(),
};

const loadMock = jest.fn().mockResolvedValue(directDebitHandlerMock);
const handlePaymentMock = jest.fn().mockResolvedValue(undefined);

const chargebeeInitMock = jest.fn().mockReturnValue({
    chargebeeMock: true,
    load: loadMock,
    createComponent: createComponentMock,
    handlePayment: handlePaymentMock,
});

beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    createFieldMock.mockClear();
    mountMock.mockClear();
    onMock.mockClear();
    createComponentMock.mockClear();
    chargebeeInitMock.mockClear();

    (global as any).Chargebee = {
        init: chargebeeInitMock,
    };

    resetChargebee();
    resetCheckpoints();

    window.__chargebeeScriptErrors = [];
    window.__chargebeeScriptFailed = false;
});

beforeEach(() => {
    window.document.body.innerHTML = `
    <body>
        <div id="chargebee-form-wrapper"></div>
    </body>
    `;
});

afterEach(() => {
    getMessageBus().destroy();
});

const defaultSetConfigurationEvent: SetConfigurationEvent = {
    type: 'set-configuration',
    correlationId: 'id-1',
    paymentMethodType: 'card',
    publishableKey: 'pk',
    site: 'site',
    domain: 'domain',
    cssVariables: {
        '--signal-danger': '#000000',
        '--border-radius-md': '#000000',
        '--border-norm': '#000000',
        '--focus-outline': '#000000',
        '--focus-ring': '#000000',
        '--field-norm': '#000000',
        '--field-background-color': '#000000',
        '--field-focus-background-color': '#000000',
        '--field-focus-text-color': '#000000',
        '--field-placeholder-color': '#000000',
        '--field-text-color': '#000000',
        '--selection-text-color': '#000000',
        '--selection-background-color': '#000000',
        '--interaction-norm': '#000000',
        '--interaction-norm-contrast': '#000000',
        '--interaction-norm-major-1': '#000000',
        '--interaction-norm-major-2': '#000000',
    },
    translations: {
        cardNumberPlaceholder: '0000 0000 0000 0000',
        cardExpiryPlaceholder: 'MM/YY',
        cardCvcPlaceholder: '000',
        invalidCardNumberMessage: 'Invalid card number',
        invalidCardExpiryMessage: 'Invalid card expiry',
        invalidCardCvcMessage: 'Invalid card cvc',
    },
    renderMode: 'one-line',
    themeType: 'light',
};

function sendEventToChargebee(event: any) {
    fireEvent(
        window,
        new MessageEvent('message', {
            data: event,
            source: window.parent,
            origin: 'https://account.proton.me',
        })
    );
}

function initChargebee(setConfiguration: SetConfigurationEvent = defaultSetConfigurationEvent) {
    const initPromise = initialize();
    sendEventToChargebee(setConfiguration);
    return initPromise;
}

function receiveMessage(type: string) {
    return new Promise<any>((resolve) => {
        window.addEventListener('message', (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === type) {
                    resolve(data);
                }
            } catch {}
        });
    });
}

describe('initialize', () => {
    it('should create message bus with onSetConfiguration and onGetHeight handlers', async () => {
        const result = await initChargebee();
        const messageBus = getMessageBus();
        expect(messageBus.onSetConfiguration).toBeDefined();
        expect(messageBus.onGetHeight).toBeDefined();

        expect(result.chargebeeMock).toEqual(true);
    });
});

describe('toReportableError', () => {
    it('should name the thrown value when it carries no message', () => {
        expect(toReportableError(false, 'card_mount').message).toBe(
            'Chargebee threw a value without a message at "card_mount": boolean false'
        );
        expect(toReportableError({ code: 'x', type: 'y' }).message).toBe(
            'Chargebee threw a value without a message: object with keys [code, type]'
        );
    });

    it('should pass through a value that already has a message', () => {
        const error = new Error('Chargebee did something specific');
        expect(toReportableError(error, 'card_mount')).toBe(error);
    });
});

describe('reported data', () => {
    function collectRawMessages(type: string) {
        const messages: string[] = [];
        window.addEventListener('message', (event: MessageEvent) => {
            try {
                if (JSON.parse(event.data).type === type) {
                    messages.push(event.data);
                }
            } catch {}
        });
        return messages;
    }

    it('should not report customer data when handling a direct debit submission throws', async () => {
        const raw = collectRawMessages('chargebee-unhandled-error');
        await initChargebee({ ...defaultSetConfigurationEvent, paymentMethodType: 'direct-debit' });

        directDebitHandlerMock.setPaymentIntent.mockImplementationOnce(() => {
            throw new Error('Chargebee rejected the mandate');
        });

        sendEventToChargebee({
            type: 'direct-debit-submit',
            correlationId: 'id-9',
            paymentIntent: { email: 'customer@example.com' },
            customer: {
                email: 'customer@example.com',
                firstName: 'Given',
                lastName: 'Family',
                company: 'Example Ltd',
                customerNameType: 'individual',
                countryCode: 'NL',
                addressLine1: '1 Example Street',
            },
            bankAccount: { iban: 'NL00EXAMPLE0000000000' },
        });
        await new Promise<void>((resolve) => setTimeout(resolve, 0));

        expect(raw).toHaveLength(1);

        const sensitiveValues = [
            'customer@example.com',
            'NL00EXAMPLE0000000000',
            'Given',
            'Family',
            'Example Ltd',
            '1 Example Street',
        ];
        for (const value of sensitiveValues) {
            expect(raw[0]).not.toContain(value);
        }

        // The report still has to be diagnosable: shape and stage, without the values.
        const reported = JSON.parse(raw[0]).error;
        expect(reported.message).toBe('Chargebee rejected the mandate');
        const checkpoint = reported.checkpoints.find((entry: any) => entry.name === 'failed_to_handle_parent_message');
        // The payload is kept so the report says which message failed, with identities removed.
        const payload = JSON.parse(checkpoint.data.eventRawData);
        expect(payload).toEqual({
            type: 'direct-debit-submit',
            correlationId: 'id-9',
            paymentIntent: { email: '[redacted]' },
            customer: {
                email: '[redacted]',
                firstName: '[redacted]',
                lastName: '[redacted]',
                company: '[redacted]',
                customerNameType: 'individual',
                countryCode: 'NL',
                addressLine1: '[redacted]',
            },
            bankAccount: { iban: '[redacted]' },
        });
    });

    it('should report the Chargebee environment of the configuration but not its theme and translations', async () => {
        const raw = collectRawMessages('chargebee-unhandled-error');

        mountMock.mockRejectedValueOnce(new Error('mount failed'));
        await initChargebee();
        await new Promise<void>((resolve) => setTimeout(resolve, 0));

        expect(raw).toHaveLength(1);
        expect(raw[0]).not.toContain('cardNumberPlaceholder');
        expect(raw[0]).not.toContain('--interaction-norm');

        // The publishable key is public and says which environment the iframe is talking to,
        // which is what ties a failure to a site. Reported on purpose.
        const checkpoint = JSON.parse(raw[0]).error.checkpoints.find((entry: any) => entry.name === 'chargebee.init');
        expect(checkpoint.data).toEqual({
            site: 'site',
            publishableKey: 'pk',
            domain: 'domain',
        });
    });

    it('should keep a thrown string, truncated to bound the Sentry title', () => {
        expect(toReportableError('CB_ERR_MANDATE_REJECTED').message).toBe(
            'Chargebee threw a value without a message: string CB_ERR_MANDATE_REJECTED'
        );
        expect(toReportableError('x'.repeat(500)).message.length).toBeLessThan(300);
    });
});

describe('failure reporting', () => {
    function collectMessages(type: string) {
        const messages: any[] = [];
        window.addEventListener('message', (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === type) {
                    messages.push(data);
                }
            } catch {}
        });
        return messages;
    }

    it('should report a mount rejection once, with a message, instead of twice', async () => {
        mountMock.mockRejectedValueOnce(false);
        const unhandledErrors = collectMessages('chargebee-unhandled-error');
        const responses = collectMessages('set-configuration-response');

        await initChargebee();
        await new Promise<void>((resolve) => queueMicrotask(() => queueMicrotask(() => resolve())));

        expect(unhandledErrors).toHaveLength(1);
        expect(unhandledErrors[0].error.message).toBe(
            'Chargebee threw a value without a message at "card_loaded_components": boolean false'
        );
        expect(unhandledErrors[0].error.checkpoints.map((checkpoint: any) => checkpoint.name)).toEqual([
            'initialize_started',
            'set_configuration_started',
            'chargebee.checking',
            'chargebee.loaded',
            'chargebee_loaded',
            'configuration_set',
            'chargebee.init',
            'chargebee.init.done',
            'instance_created',
            'rendering_card',
            'card_loaded_components',
            'initialize_failed',
        ]);

        // The step must name what failed, not the checkpoint the reporter adds before sending.
        expect(unhandledErrors[0].error.stage).toBe('card_loaded_components');

        expect(responses).toHaveLength(1);
        expect(responses[0].status).toBe('failure');
    });

    it('should still report a failure of a set-configuration that follows a successful one', async () => {
        const unhandledErrors = collectMessages('chargebee-unhandled-error');

        await initChargebee();
        expect(unhandledErrors).toHaveLength(0);

        // The parent re-sends set-configuration on render mode, currency and payment method changes.
        mountMock.mockRejectedValueOnce(false);
        sendEventToChargebee({ ...defaultSetConfigurationEvent, correlationId: 'id-2' });
        await new Promise<void>((resolve) => setTimeout(resolve, 0));

        expect(unhandledErrors).toHaveLength(1);
        expect(unhandledErrors[0].error.message).toBe(
            'Chargebee threw a value without a message at "card_loaded_components": boolean false'
        );
        expect(unhandledErrors[0].error.stage).toBe('card_loaded_components');
    });

    it('should keep the form submittable when the mount budget expires', async () => {
        jest.useFakeTimers();
        const unhandledErrors = collectMessages('chargebee-unhandled-error');
        const responses = collectMessages('set-configuration-response');

        // Mounting is not cancelled, so the fields can still appear afterwards.
        mountMock.mockReturnValueOnce(new Promise(() => {}));
        void initChargebee();
        await jest.advanceTimersByTimeAsync(25000);
        jest.useRealTimers();

        expect(unhandledErrors).toHaveLength(1);
        expect(unhandledErrors[0].error.message).toBe('Chargebee "card_mount" did not complete within 20000ms');
        expect(unhandledErrors[0].error.stage).toBe('card_mount_timed_out');

        // The failure is reported but the form is not abandoned: the parent is told it is ready.
        expect(responses).toHaveLength(1);
        expect(responses[0].status).toBe('success');

        sendEventToChargebee({
            type: 'chargebee-submit',
            correlationId: 'id-mount-timeout',
            paymentIntent: {
                data: '123',
                object_type: 'payment_intent',
                email: 'test@example.com',
            },
            countryCode: 'US',
            zip: '97531',
        });

        // Before setup continued past the time limit, nothing handled submit and the parent
        // waited for a reply that never came.
        expect(authorizeWith3dsMock).toHaveBeenCalledTimes(1);
        expect(authorizeWith3dsMock.mock.calls[0][0]).toEqual({
            data: '123',
            object_type: 'payment_intent',
            email: 'test@example.com',
        });
    });

    it('should report the failed scripts alongside the Chargebee load failure, on one event', async () => {
        jest.useFakeTimers();
        const unhandledErrors = collectMessages('chargebee-unhandled-error');

        delete (global as any).Chargebee;
        window.__chargebeeScriptErrors = [
            'https://js.chargebee.com/v2/chargebee.js',
            'https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js',
        ];
        window.__chargebeeScriptFailed = true;

        void initChargebee();
        await jest.advanceTimersByTimeAsync(50000);
        jest.useRealTimers();

        expect(unhandledErrors).toHaveLength(1);
        const report = unhandledErrors[0].error;

        // The checkpoint says which script failed and why Chargebee is missing.
        const loadFailed = report.checkpoints.find(({ name }: any) => name === 'chargebee.load_failed');
        expect(loadFailed.data.chargebeeScriptFailed).toBe(true);
        expect(report.message).toBe('Chargebee script failed to load');

        // The sources live once, at the root of the same event, rather than in the checkpoint too.
        expect(report.scriptLoadErrors).toBe(
            'https://js.chargebee.com/v2/chargebee.js https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js'
        );
        expect(report.scriptLoadErrorCount).toBe(2);
        expect(loadFailed.data.otherScriptLoadErrors).toBeUndefined();
    });

    it('should name the stalled stage rather than the watchdog itself', async () => {
        jest.useFakeTimers();
        const unhandledErrors = collectMessages('chargebee-unhandled-error');

        // A mount that never finishes is what production sessions actually hit.
        mountMock.mockReturnValueOnce(new Promise(() => {}));
        void initChargebee();
        await jest.advanceTimersByTimeAsync(200000);
        jest.useRealTimers();

        expect(unhandledErrors).toHaveLength(1);
        expect(unhandledErrors[0].error.message).toBe('Chargebee "card_mount" did not complete within 20000ms');
        expect(unhandledErrors[0].error.stage).toBe('card_mount_timed_out');
    });
});

describe('height test', () => {
    let initialScrollHeight: number;

    beforeEach(() => {
        initialScrollHeight = document.body.scrollHeight;

        Object.defineProperty(document.body, 'scrollHeight', {
            value: 1000,
            configurable: true,
        });
    });

    afterEach(() => {
        Object.defineProperty(document.body, 'scrollHeight', {
            value: initialScrollHeight,
            configurable: true,
        });
    });

    it('should return the height of the form', async () => {
        await initChargebee();

        const getHeight: GetHeightEvent = {
            type: 'get-height',
            correlationId: 'id-1',
        };

        sendEventToChargebee(getHeight);

        const heightResponse = await receiveMessage('get-height-response');

        expect(heightResponse.data).toMatchObject({
            // the total height must include the extra bottom too
            height: 1036,
            extraBottom: 36,
        });
    });
});

function extractAuthorizeWith3dsCallbacks() {
    const callbacks = authorizeWith3dsMock.mock.calls[0][2];
    const challengeCallback = callbacks.challenge;

    const thenCallback = authorizeWith3dsThenMock.mock.calls[0][0];
    const catchCallback = authorizeWith3dsCatchMock.mock.calls[0][0];

    return {
        challengeCallback,
        thenCallback,
        catchCallback,
    };
}

describe('Credit card', () => {
    it('should render the template', async () => {
        await initChargebee();
        expect(document.getElementById('chargebee-form-wrapper')).toBeDefined();
        expect(document.querySelector('.card-input')).toBeDefined();
    });

    it('should initialize the form', async () => {
        const chargebee = await initChargebee();
        expect(chargebee.load).toHaveBeenCalledWith('components');

        expect(chargebee.createComponent).toHaveBeenCalledTimes(1);
        expect(chargebee.createComponent.mock.calls[0][0]).toEqual('card');

        expect(createFieldMock).toHaveBeenCalledTimes(3);
        expect(createFieldMock.mock.calls[0][0]).toEqual('number');
        expect(createFieldMock.mock.calls[1][0]).toEqual('expiry');
        expect(createFieldMock.mock.calls[2][0]).toEqual('cvv');

        expect(mountMock).toHaveBeenCalledTimes(1);
    });

    it('should return bin', async () => {
        await initChargebee();

        const binData: BinData = {
            bin: '123456',
            last4: '3456',
        };
        getBinDataMock.mockReturnValueOnce(binData);

        sendEventToChargebee({
            type: 'get-bin',
            correlationId: 'id-2',
        });

        const binResponse = await receiveMessage('get-bin-response');
        expect(binResponse.data).toEqual(binData);
    });

    it('should submit the form', async () => {
        await initChargebee();

        sendEventToChargebee({
            type: 'chargebee-submit',
            correlationId: 'id-3',
            paymentIntent: {
                data: '123',
                object_type: 'payment_intent',
                email: 'test@example.com',
            },
            countryCode: 'US',
            zip: '97531',
        });

        expect(authorizeWith3dsMock).toHaveBeenCalledTimes(1);
        // the first arg must be the payment intent
        expect(authorizeWith3dsMock.mock.calls[0][0]).toEqual({
            data: '123',
            object_type: 'payment_intent',
            email: 'test@example.com',
        });
        // the second one must be the billing details
        expect(authorizeWith3dsMock.mock.calls[0][1]).toEqual({
            billingAddress: {
                countryCode: 'US',
                zip: '97531',
            },
            email: 'test@example.com',
        });

        const { challengeCallback, thenCallback, catchCallback } = extractAuthorizeWith3dsCallbacks();

        expect(challengeCallback).toBeDefined();
        expect(thenCallback).toBeDefined();
        expect(catchCallback).toBeDefined();
    });

    it('should submit the form (no email)', async () => {
        await initChargebee();

        sendEventToChargebee({
            type: 'chargebee-submit',
            correlationId: 'id-3',
            paymentIntent: {
                data: '123',
                object_type: 'payment_intent',
            },
            countryCode: 'US',
            zip: '97531',
        });

        expect(authorizeWith3dsMock).toHaveBeenCalledTimes(1);
        // the first arg must be the payment intent
        expect(authorizeWith3dsMock.mock.calls[0][0]).toEqual({
            data: '123',
            object_type: 'payment_intent',
        });
        // the second one must be the billing details
        expect(authorizeWith3dsMock.mock.calls[0][1]).toEqual({
            billingAddress: {
                countryCode: 'US',
                zip: '97531',
            },
            email: FALLBACK_EMAIL,
        });

        const { challengeCallback, thenCallback, catchCallback } = extractAuthorizeWith3dsCallbacks();

        expect(challengeCallback).toBeDefined();
        expect(thenCallback).toBeDefined();
        expect(catchCallback).toBeDefined();
    });

    it('should send 3ds challenge response', async () => {
        await initChargebee();

        sendEventToChargebee({
            type: 'chargebee-submit',
            correlationId: 'id-3',
            paymentIntent: {
                data: '123',
                object_type: 'payment_intent',
            },
            countryCode: 'US',
            zip: '97531',
        });

        const { challengeCallback } = extractAuthorizeWith3dsCallbacks();

        const url = 'https://proton.me/3ds-challenge';
        challengeCallback(url);

        const message = await receiveMessage('3ds-challenge');
        expect(message).toEqual({
            type: '3ds-challenge',
            status: 'success',
            correlationId: 'id-3', // the same as the original submit message
            data: { url },
        });
    });

    it('should send submission success', async () => {
        await initChargebee();

        sendEventToChargebee({
            type: 'chargebee-submit',
            correlationId: 'id-3',
            paymentIntent: {
                data: '123',
                object_type: 'payment_intent',
            },
            countryCode: 'US',
            zip: '97531',
        });

        const { thenCallback } = extractAuthorizeWith3dsCallbacks();
        const authorizedPaymentIntent = {
            data: '123',
            object_type: 'payment_intent',
            status: 'authorized',
        };
        thenCallback(authorizedPaymentIntent);

        const message = await receiveMessage('chargebee-submit-response');
        expect(message).toEqual(
            expect.objectContaining({
                type: 'chargebee-submit-response',
                status: 'success',
                correlationId: 'id-3',
                data: {
                    authorized: true,
                    authorizedPaymentIntent,
                },
            })
        );
    });

    it('should send submission error', async () => {
        await initChargebee();

        sendEventToChargebee({
            type: 'chargebee-submit',
            correlationId: 'id-3',
            paymentIntent: {
                data: '123',
                object_type: 'payment_intent',
            },
            countryCode: 'US',
            zip: '97531',
        });

        const { catchCallback } = extractAuthorizeWith3dsCallbacks();
        const error = new Error('some error');
        catchCallback(error);

        const message = await receiveMessage('chargebee-submit-response');
        expect(message).toMatchObject({
            type: 'chargebee-submit-response',
            status: 'failure',
            correlationId: 'id-3',
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name,
            },
        });
    });
});

describe('formatCustomer', () => {
    const baseCustomer: DirectDebitCustomer = {
        email: 'test@example.com',
        company: 'Test Company',
        firstName: 'John',
        lastName: 'Doe',
        customerNameType: 'individual',
        countryCode: 'US',
        addressLine1: '123 Test St',
    };

    it('should format customer with individual name type', () => {
        const customer: DirectDebitCustomer = {
            ...baseCustomer,
            customerNameType: 'individual',
        };

        const formattedCustomer = formatCustomer(customer);

        expect(formattedCustomer).toEqual({
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            billingAddress: {
                countryCode: 'US',
                addressLine1: '123 Test St',
            },
        });
    });

    it('should format customer with company name type', () => {
        const customer: DirectDebitCustomer = {
            ...baseCustomer,
            customerNameType: 'company',
        };

        const formattedCustomer = formatCustomer(customer);

        expect(formattedCustomer).toEqual({
            email: 'test@example.com',
            company: 'Test Company',
            billingAddress: {
                countryCode: 'US',
                addressLine1: '123 Test St',
            },
        });
    });

    it('should handle missing optional fields', () => {
        const customer: DirectDebitCustomer = {
            ...baseCustomer,
            customerNameType: 'individual',
            countryCode: '',
            addressLine1: '',
        };

        const formattedCustomer = formatCustomer(customer);

        expect(formattedCustomer).toEqual({
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            billingAddress: {
                countryCode: null,
                addressLine1: null,
            },
        });
    });

    it('should handle all optional fields being present', () => {
        const customer: DirectDebitCustomer = {
            ...baseCustomer,
            customerNameType: 'company',
            countryCode: 'GB',
            addressLine1: '456 Test Ave',
        };

        const formattedCustomer = formatCustomer(customer);

        expect(formattedCustomer).toEqual({
            email: 'test@example.com',
            company: 'Test Company',
            billingAddress: {
                countryCode: 'GB',
                addressLine1: '456 Test Ave',
            },
        });
    });
});

describe('Direct Debit', () => {
    beforeEach(async () => {
        // Set up the configuration for direct debit
        const directDebitConfig = {
            ...defaultSetConfigurationEvent,
            paymentMethodType: 'direct-debit' as const,
        };
        await initChargebee(directDebitConfig);
    });

    it('should initialize direct debit handler', async () => {
        expect(loadMock).toHaveBeenCalledWith('direct_debit');
    });

    it('should handle direct debit submission', async () => {
        const paymentIntent: PaymentIntent = {
            id: 'pi_123',
            status: 'inited',
            amount: 1000,
            currency_code: 'USD',
            gateway_account_id: 'ga_123',
            gateway: 'stripe',
            customer_id: 'cust_123',
            payment_method_type: 'card',
            expires_at: 1234567890,
            created_at: 1234567890,
            modified_at: 1234567890,
            updated_at: 1234567890,
            resource_version: 1234567890,
            object: 'payment_intent',
        };

        const customer: DirectDebitCustomer = {
            email: 'test@example.com',
            company: 'Test Company',
            firstName: 'John',
            lastName: 'Doe',
            customerNameType: 'individual',
            countryCode: 'US',
            addressLine1: '123 Test St',
        };

        const bankAccount = {
            iban: 'DE89370400440532013000',
        };

        const directDebitSubmitEvent: DirectDebitSubmitEvent = {
            type: 'direct-debit-submit',
            correlationId: 'dd-123',
            paymentIntent,
            customer,
            bankAccount,
        };

        sendEventToChargebee(directDebitSubmitEvent);

        // Wait for the message bus to process the event
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(directDebitHandlerMock.setPaymentIntent).toHaveBeenCalledWith(paymentIntent);
        expect(directDebitHandlerMock.handlePayment).toHaveBeenCalledWith(
            {
                bankAccount,
                customer: {
                    email: 'test@example.com',
                    firstName: 'John',
                    lastName: 'Doe',
                    billingAddress: {
                        countryCode: 'US',
                        addressLine1: '123 Test St',
                    },
                },
            },
            expect.objectContaining({
                success: expect.any(Function),
                error: expect.any(Function),
            })
        );
    });

    it('should handle direct debit success', async () => {
        const directDebitSubmitEvent: DirectDebitSubmitEvent = {
            type: 'direct-debit-submit',
            correlationId: 'dd-123',
            paymentIntent: {} as PaymentIntent,
            customer: {} as DirectDebitCustomer,
            bankAccount: { iban: 'DE89370400440532013000' },
        };

        sendEventToChargebee(directDebitSubmitEvent);

        // Wait for the message bus to process the event
        await new Promise((resolve) => setTimeout(resolve, 0));

        const successCallback = directDebitHandlerMock.handlePayment.mock.calls[0][1].success;
        const authorizedPaymentIntent: AuthorizedPaymentIntent = {
            id: 'pi_123',
            status: 'authorized',
            amount: 1000,
            currency_code: 'USD',
            gateway_account_id: 'ga_123',
            gateway: 'stripe',
            customer_id: 'cust_123',
            payment_method_type: 'card',
            expires_at: 1234567890,
            created_at: 1234567890,
            modified_at: 1234567890,
            updated_at: 1234567890,
            resource_version: 1234567890,
            object: 'payment_intent',
            active_payment_attempt: {
                id: 'pa_123',
                status: 'authorized',
                payment_method_type: 'card',
                id_at_gateway: 'ch_123',
                created_at: 1234567890,
                modified_at: 1234567890,
                object: 'payment_attempt',
            },
        };

        successCallback(authorizedPaymentIntent);

        const message = await receiveMessage('direct-debit-submit-response');
        expect(message).toEqual(
            expect.objectContaining({
                type: 'direct-debit-submit-response',
                status: 'success',
                correlationId: 'dd-123',
                data: authorizedPaymentIntent,
            })
        );
    });

    it('should handle direct debit error', async () => {
        const directDebitSubmitEvent: DirectDebitSubmitEvent = {
            type: 'direct-debit-submit',
            correlationId: 'dd-123',
            paymentIntent: {} as PaymentIntent,
            customer: {} as DirectDebitCustomer,
            bankAccount: { iban: 'DE89370400440532013000' },
        };

        sendEventToChargebee(directDebitSubmitEvent);

        // Wait for the message bus to process the event
        await new Promise((resolve) => setTimeout(resolve, 0));

        const errorCallback = directDebitHandlerMock.handlePayment.mock.calls[0][1].error;
        const error = new Error('Direct debit payment failed');

        errorCallback(error);

        const message = await receiveMessage('direct-debit-submit-response');
        expect(message).toEqual(
            expect.objectContaining({
                type: 'direct-debit-submit-response',
                status: 'failure',
                correlationId: 'dd-123',
                error: expect.objectContaining({
                    message: 'Direct debit payment failed',
                    stack: error.stack,
                    name: error.name,
                }),
            })
        );
    });
});

describe('iDEAL', () => {
    const paymentIntent = { email: 'andy.yen@proton.me' } as PaymentIntent;

    beforeEach(async () => {
        await initChargebee({
            ...defaultSetConfigurationEvent,
            paymentMethodType: 'ideal' as const,
        });
    });

    const clickIdealButtonWithName = async (userName: string) => {
        sendEventToChargebee({
            type: 'set-ideal-payment-intent',
            correlationId: 'ideal-123',
            paymentIntent,
            userName,
            buttonLabel: 'Pay with iDEAL',
        });

        // Wait for the message bus to process the event
        await new Promise((resolve) => setTimeout(resolve, 0));

        document.querySelector<HTMLButtonElement>('#ideal-button')!.click();
    };

    it('should pay with the account holder name provided by the parent', async () => {
        await clickIdealButtonWithName('Andy Yen');

        expect(handlePaymentMock).toHaveBeenCalledWith(
            'ideal',
            expect.objectContaining({
                paymentInfo: {
                    userName: 'Andy Yen',
                    userEmail: 'andy.yen@proton.me',
                },
            })
        );
    });

    it('should fall back when the account holder name is missing', async () => {
        await clickIdealButtonWithName('');

        expect(handlePaymentMock).toHaveBeenCalledWith(
            'ideal',
            expect.objectContaining({
                paymentInfo: {
                    userName: '',
                    userEmail: 'andy.yen@proton.me',
                },
            })
        );
    });
});
