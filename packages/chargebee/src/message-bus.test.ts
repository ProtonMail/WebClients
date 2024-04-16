import { fireEvent } from '@testing-library/dom';

import {
    BinData,
    ChargebeeSubmitEventResponse,
    FormValidationErrors,
    GetHeightResponsePayload,
    MessageBusResponse,
    PaymentIntent,
    PaypalAuthorizedPayload,
    ThreeDsChallengePayload,
} from '../lib';
import {
    ChargebeeSubmitEvent,
    GetBinEvent,
    GetHeightEvent,
    MessageBus,
    ParentMessagesProps,
    SetConfigurationEvent,
    SetPaypalPaymentIntentEvent,
    ValidateFormEvent,
    VerifySavedCardEvent,
    createMessageBus,
    getMessageBus,
    verifySavedCardMessageType,
} from './message-bus';

window.parent.postMessage = jest.fn();

let messageBus: MessageBus | null = null;
beforeEach(() => {
    jest.clearAllMocks();

    const config: ParentMessagesProps = {
        onSetConfiguration: jest.fn(),
        onSubmit: jest.fn(),
        onSetPaypalPaymentIntent: jest.fn(),
        onGetHeight: jest.fn(),
        onGetBin: jest.fn(),
        onValidateForm: jest.fn(),
        onVerifySavedCard: jest.fn(),
    };

    createMessageBus(config);

    messageBus = getMessageBus();
});

it('should create message bus', () => {
    const messageBus = getMessageBus();
    expect(messageBus).toBeInstanceOf(MessageBus);
});

it('should listen to set configuration event', () => {
    const event: SetConfigurationEvent = {
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

    fireEvent(
        window,
        new MessageEvent('message', {
            data: event,
        })
    );
    expect(messageBus?.onSetConfiguration).toHaveBeenCalled();
    const firstArg = (messageBus?.onSetConfiguration as jest.Mock).mock.calls[0][0];
    expect(firstArg).toEqual(event);

    const secondArg = (messageBus?.onSetConfiguration as jest.Mock).mock.calls[0][1];
    expect(secondArg).toBeInstanceOf(Function);

    const response: MessageBusResponse<{}> = {
        status: 'success',
        data: {},
    };
    secondArg(response);
    expect(window.parent.postMessage).toHaveBeenCalledWith(
        JSON.stringify({
            type: 'set-configuration-response',
            correlationId: event.correlationId,
            status: 'success',
            data: {},
        }),
        '*'
    );
});

it('should listen to submit event', () => {
    const event: ChargebeeSubmitEvent = {
        type: 'chargebee-submit',
        correlationId: 'id-1',
        paymentIntent: {
            type: 'payment_intent',
        } as any,
        countryCode: 'US',
        zip: '12345',
    };

    fireEvent(
        window,
        new MessageEvent('message', {
            data: event,
        })
    );

    expect(messageBus?.onSubmit).toHaveBeenCalled();
    const firstArg = (messageBus?.onSubmit as jest.Mock).mock.calls[0][0];
    expect(firstArg).toEqual(event);

    const secondArg = (messageBus?.onSubmit as jest.Mock).mock.calls[0][1];
    expect(secondArg).toBeInstanceOf(Function);

    const response: MessageBusResponse<{}> = {
        status: 'success',
        data: {},
    };
    secondArg(response);
    expect(window.parent.postMessage).toHaveBeenCalledWith(
        JSON.stringify({
            type: 'chargebee-submit-response',
            correlationId: event.correlationId,
            status: 'success',
            data: {},
        }),
        '*'
    );
});

it('should listen to set paypal payment intent event', () => {
    const event: SetPaypalPaymentIntentEvent = {
        type: 'set-paypal-payment-intent',
        correlationId: 'id-1',
        paymentIntent: {
            type: 'payment_intent',
        } as any,

        // todo: perhaps remove it
        countryCode: 'US',
        zip: '12345',
    };

    fireEvent(
        window,
        new MessageEvent('message', {
            data: event,
        })
    );

    expect(messageBus?.onSetPaypalPaymentIntent).toHaveBeenCalled();
    const firstArg = (messageBus?.onSetPaypalPaymentIntent as jest.Mock).mock.calls[0][0];
    expect(firstArg).toEqual(event);

    const secondArg = (messageBus?.onSetPaypalPaymentIntent as jest.Mock).mock.calls[0][1];
    expect(secondArg).toBeInstanceOf(Function);

    const response: MessageBusResponse<ChargebeeSubmitEventResponse> = {
        status: 'success',
        data: {
            authorized: false,
            approvalUrl: 'https://proton.me',
        } as any, // todo: fix types
    };

    secondArg(response);
    expect(window.parent.postMessage).toHaveBeenCalledWith(
        JSON.stringify({
            type: 'set-paypal-payment-intent-response',
            correlationId: event.correlationId,
            status: 'success',
            data: {
                authorized: false,
                approvalUrl: 'https://proton.me',
            },
        }),
        '*'
    );
});

it('should listen to get height event', () => {
    const event: GetHeightEvent = {
        type: 'get-height',
        correlationId: 'id-1',
    };

    fireEvent(
        window,
        new MessageEvent('message', {
            data: event,
        })
    );

    expect(messageBus?.onGetHeight).toHaveBeenCalled();
    const firstArg = (messageBus?.onGetHeight as jest.Mock).mock.calls[0][0];
    expect(firstArg).toEqual(event);

    const secondArg = (messageBus?.onGetHeight as jest.Mock).mock.calls[0][1];
    expect(secondArg).toBeInstanceOf(Function);

    const response: MessageBusResponse<GetHeightResponsePayload> = {
        status: 'success',
        data: {
            height: 100,
            extraBottom: 8,
        },
    };
    secondArg(response);
    expect(window.parent.postMessage).toHaveBeenCalledWith(
        JSON.stringify({
            type: 'get-height-response',
            correlationId: event.correlationId,
            status: 'success',
            data: {
                height: 100,
                extraBottom: 8,
            },
        }),
        '*'
    );
});

it('should listen to get bin event', () => {
    const event: GetBinEvent = {
        type: 'get-bin',
        correlationId: 'id-1',
    };

    fireEvent(
        window,
        new MessageEvent('message', {
            data: event,
        })
    );

    expect(messageBus?.onGetBin).toHaveBeenCalled();
    const firstArg = (messageBus?.onGetBin as jest.Mock).mock.calls[0][0];
    expect(firstArg).toEqual(event);

    const secondArg = (messageBus?.onGetBin as jest.Mock).mock.calls[0][1];
    expect(secondArg).toBeInstanceOf(Function);

    const response: MessageBusResponse<BinData> = {
        status: 'success',
        data: {
            bin: '424242',
            last4: '4242',
        },
    };
    secondArg(response);

    expect(window.parent.postMessage).toHaveBeenCalledWith(
        JSON.stringify({
            type: 'get-bin-response',
            correlationId: event.correlationId,
            ...response,
        }),
        '*'
    );
});

it('should listen to validate form event', () => {
    const event: ValidateFormEvent = {
        type: 'validate-form',
        correlationId: 'id-1',
    };

    fireEvent(
        window,
        new MessageEvent('message', {
            data: event,
        })
    );

    expect(messageBus?.onValidateForm).toHaveBeenCalled();
    const firstArg = (messageBus?.onValidateForm as jest.Mock).mock.calls[0][0];
    expect(firstArg).toEqual(event);

    const secondArg = (messageBus?.onValidateForm as jest.Mock).mock.calls[0][1];
    expect(secondArg).toBeInstanceOf(Function);

    const response: MessageBusResponse<FormValidationErrors> = {
        status: 'success',
        data: [],
    };

    secondArg(response);

    expect(window.parent.postMessage).toHaveBeenCalledWith(
        JSON.stringify({
            type: 'validate-form-response',
            correlationId: event.correlationId,
            status: 'success',
            data: [],
        }),
        '*'
    );
});

it('should listen to verify saved card event', () => {
    const event: VerifySavedCardEvent = {
        type: verifySavedCardMessageType,
        correlationId: 'id-1',
        paymentIntent: {
            type: 'payment_intent',
        } as any,
    };

    fireEvent(
        window,
        new MessageEvent('message', {
            data: event,
        })
    );

    expect(messageBus?.onVerifySavedCard).toHaveBeenCalled();

    const firstArg = (messageBus?.onVerifySavedCard as jest.Mock).mock.calls[0][0];
    expect(firstArg).toEqual(event);

    const secondArg = (messageBus?.onVerifySavedCard as jest.Mock).mock.calls[0][1];
    expect(secondArg).toBeInstanceOf(Function);

    const response: MessageBusResponse<ChargebeeSubmitEventResponse> = {
        status: 'success',
        data: {
            authorized: false,
            approvalUrl: 'https://proton.me',
        } as any, // todo: fix types
    };
    secondArg(response);

    expect(window.parent.postMessage).toHaveBeenCalledWith(
        JSON.stringify({
            type: 'chargebee-verify-saved-card-response',
            correlationId: event.correlationId,
            status: 'success',
            data: {
                authorized: false,
                approvalUrl: 'https://proton.me',
            },
        }),
        '*'
    );
});

it('should send paypal authorized message', () => {
    const data: PaypalAuthorizedPayload = {
        paymentIntent: {
            type: 'payment_intent',
        } as any,
    };

    messageBus?.sendPaypalAuthorizedMessage(data);
    const expectedMessage = {
        status: 'success',
        data,
    };

    expect(window.parent.postMessage).toHaveBeenCalledWith(
        JSON.stringify({
            type: 'paypal-authorized',
            ...expectedMessage,
        }),
        '*'
    );
});

it('should send 3ds challenge message', () => {
    const data: ThreeDsChallengePayload = {
        url: 'https://proton.me',
    };

    const correlationId = 'id-1';

    messageBus?.send3dsChallengeMessage(data, correlationId);
    const expectedMessage = {
        status: 'success',
        data,
        correlationId,
    };

    expect(window.parent.postMessage).toHaveBeenCalledWith(
        JSON.stringify({
            type: '3ds-challenge',
            ...expectedMessage,
        }),
        '*'
    );
});

it('should send 3ds failed message', () => {
    const error = {
        message: 'error',
    };

    const correlationId = 'id-1';

    messageBus?.send3dsFailedMessage(error, correlationId);
    const expectedMessage = {
        status: 'failure',
        error,
        correlationId,
    };

    expect(window.parent.postMessage).toHaveBeenCalledWith(
        JSON.stringify({
            type: 'chargebee-submit-response',
            ...expectedMessage,
        }),
        '*'
    );
});

it('should send form validation error message', () => {
    const errors: FormValidationErrors = [
        {
            message: 'error',
            error: 'error',
        },
    ];

    const correlationId = 'id-1';

    messageBus?.sendFormValidationErrorMessage(errors, correlationId);
    const expectedMessage = {
        status: 'failure',
        error: errors,
        correlationId,
    };

    expect(window.parent.postMessage).toHaveBeenCalledWith(
        JSON.stringify({
            type: 'chargebee-submit-response',
            ...expectedMessage,
        }),
        '*'
    );
});

it('should send 3ds success message', () => {
    const paymentIntent: PaymentIntent = {
        type: 'payment_intent',
    } as any;

    const correlationId = 'id-1';

    messageBus?.send3dsSuccessMessage(
        paymentIntent as any, // todo: fix types
        correlationId
    );

    const expectedMessage = {
        status: 'success',
        data: paymentIntent,
        correlationId,
    };

    expect(window.parent.postMessage).toHaveBeenCalledWith(
        JSON.stringify({
            type: 'chargebee-submit-response',
            ...expectedMessage,
        }),
        '*'
    );
});
