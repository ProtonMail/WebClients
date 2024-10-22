import { fireEvent } from '@testing-library/dom';

import type { BinData } from '../lib';
import type { AuthorizedPaymentIntent, DirectDebitCustomer, PaymentIntent } from '../lib/types';
import { resetChargebee } from './chargebee';
import { formatCustomer, initialize } from './chargebee-entry';
import type { DirectDebitSubmitEvent, GetHeightEvent, SetConfigurationEvent } from './message-bus';
import { getMessageBus } from './message-bus';

jest.mock('./ui-utils');

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

const chargebeeInitMock = jest.fn().mockReturnValue({
    chargebeeMock: true,
    load: loadMock,
    createComponent: createComponentMock,
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
};

function sendEventToChargebee(event: any) {
    fireEvent(
        window,
        new MessageEvent('message', {
            data: event,
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
                challenge: expect.any(Function),
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
