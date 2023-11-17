import { fireEvent } from '@testing-library/dom';

import { BinData } from '../lib';
import { resetChargebee } from './chargebee';
import { initialize } from './chargebee-entry';
import { GetHeightEvent, SetConfigurationEvent, getMessageBus } from './message-bus';

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

const chargebeeInitMock = jest.fn().mockReturnValue({
    chargebeeMock: true,
    load: jest.fn(),
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
        '--field-focus-background-color': '#000000',
        '--field-focus-text-color': '#000000',
        '--field-placeholder-color': '#000000',
        '--field-text-color': '#000000',
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
        expect(message).toEqual({
            type: 'chargebee-submit-response',
            status: 'success',
            correlationId: 'id-3', // the same as the original submit message
            data: {
                authorized: true,
                authorizedPaymentIntent,
            },
        });
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
        const error = {
            error: 'some error',
            displayMessage: 'some display message',
        };
        catchCallback(error);

        const message = await receiveMessage('chargebee-submit-response');
        expect(message).toEqual({
            type: 'chargebee-submit-response',
            status: 'failure',
            correlationId: 'id-3', // the same as the original submit message
            error,
        });
    });
});
