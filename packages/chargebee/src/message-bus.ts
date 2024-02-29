import noop from '@proton/utils/noop';

import {
    BinData,
    CardFormRenderMode,
    CbCardConfig,
    CbIframeResponseStatus,
    ChargebeeSavedCardAuthorizationSuccess,
    ChargebeeSubmitEventPayload,
    ChargebeeSubmitEventResponse,
    ChargebeeVerifySavedCardEventPayload,
    FormValidationErrors,
    GetHeightResponsePayload,
    MessageBusResponse,
    PaypalAuthorizedPayload,
    PaypalCancelledMessage,
    PaypalClickedMessage,
    PaypalFailedMessage,
    SavedCardVerificationFailureMessage,
    SavedCardVerificationSuccessMessage,
    ThreeDsChallengeMessage,
    ThreeDsChallengePayload,
    ThreeDsFailedMessage,
    ThreeDsRequiredForSavedCardMessage,
    UnhandledErrorMessage,
    paypalAuthorizedMessageType,
    paypalCancelledMessageType,
    paypalClickedMessageType,
    paypalFailedMessageType,
    threeDsChallengeMessageType,
    unhandledError,
} from '../lib';
import { addCheckpoint, chargebeeWrapperVersion, getCheckpoints } from './checkpoints';

function isChargebeeEvent(event: any): boolean {
    return !!event?.cbEvent;
}

type SendResponseToParent<T> = (response: MessageBusResponse<T>) => void;

// SetConfigurationEvent

export type SetConfigurationEvent = {
    type: 'set-configuration';
    correlationId: string;
} & CbCardConfig;

function isSetConfigurationEvent(event: any): event is SetConfigurationEvent {
    return event?.type === 'set-configuration';
}

// OnSubmitHandler

export type ChargebeeSubmitEvent = {
    type: 'chargebee-submit';
    correlationId: string;
} & ChargebeeSubmitEventPayload;

export function isChargebeeSubmitEvent(event: any): event is ChargebeeSubmitEvent {
    return event?.type === 'chargebee-submit';
}

export type OnSubmitHandler = (
    event: ChargebeeSubmitEvent,
    sendResponseToParent: SendResponseToParent<ChargebeeSubmitEventResponse>
) => void;

export type SetPaypalPaymentIntentEvent = {
    type: 'set-paypal-payment-intent';
    correlationId: string;
    paypalButtonHeight?: number;
} & ChargebeeSubmitEventPayload;

export function isSetPaypalPaymentIntentEvent(event: any): event is SetPaypalPaymentIntentEvent {
    return event?.type === 'set-paypal-payment-intent';
}

// GetHeightEvent

export type GetHeightEvent = {
    type: 'get-height';
    correlationId: string;
};

export function isGetHeightEvent(event: any): event is GetHeightEvent {
    return event?.type === 'get-height';
}

export type OnSetPaypalPaymentIntentHandler = (
    event: SetPaypalPaymentIntentEvent,
    sendResponseToParent: SendResponseToParent<void>
) => void;

// GetBinEvent

export type GetBinEvent = {
    type: 'get-bin';
    correlationId: string;
};

export function isGetBinEvent(event: any): event is GetBinEvent {
    return event?.type === 'get-bin';
}

export type OnGetBinHandler = (event: GetBinEvent, sendResponseToParent: SendResponseToParent<BinData | null>) => void;

// ValidateFormEvent

export type ValidateFormEvent = {
    type: 'validate-form';
    correlationId: string;
};

export function isValidateFormEvent(event: any): event is ValidateFormEvent {
    return event?.type === 'validate-form';
}

export type OnValidateFormHandler = (
    event: ValidateFormEvent,
    sendResponseToParent: SendResponseToParent<FormValidationErrors>
) => void;

// VerifySavedCardEvent

export const verifySavedCardMessageType = 'chargebee-verify-saved-card';

export type VerifySavedCardEvent = {
    type: typeof verifySavedCardMessageType;
    correlationId: string;
} & ChargebeeVerifySavedCardEventPayload;

export function isVerifySavedCardEvent(event: any): event is VerifySavedCardEvent {
    return event?.type === verifySavedCardMessageType;
}

export type OnVerifySavedCardHandler = (
    event: VerifySavedCardEvent,
    sendResponseToParent: SendResponseToParent<ChargebeeSubmitEventResponse>
) => void;

// ChangeRenderModeEvent

export const changeRenderModeMessageType = 'change-render-mode';

export type ChangeRenderModeEvent = {
    type: typeof changeRenderModeMessageType;
    correlationId: string;
    renderMode: CardFormRenderMode;
};

export function isChangeRenderModeEvent(event: any): event is ChangeRenderModeEvent {
    return event?.type === changeRenderModeMessageType;
}

export type OnChangeRenderModeHandler = (
    event: ChangeRenderModeEvent,
    sendResponseToParent: SendResponseToParent<{}>
) => void;

export interface ParentMessagesProps {
    onSetConfiguration?: (event: SetConfigurationEvent, sendResponseToParent: SendResponseToParent<{}>) => void;
    onSubmit?: OnSubmitHandler;
    onSetPaypalPaymentIntent?: OnSetPaypalPaymentIntentHandler;
    onGetHeight?: (event: GetHeightEvent, sendResponseToParent: SendResponseToParent<GetHeightResponsePayload>) => void;
    onGetBin?: OnGetBinHandler;
    onValidateForm?: OnValidateFormHandler;
    onVerifySavedCard?: OnVerifySavedCardHandler;
    onChangeRenderMode?: OnChangeRenderModeHandler;
}

// the event handler function must be async to make sure that we catch all errors, sync and async
const getEventListener = (messageBus: MessageBus) => async (e: MessageEvent) => {
    try {
        const parseEvent = (data: any) => {
            if (typeof data !== 'string') {
                return data;
            }

            let props;
            try {
                props = JSON.parse(data);
            } catch (error) {
                props = {};
            }
            return props;
        };

        const event = parseEvent(e.data);

        if (isSetConfigurationEvent(event)) {
            // Do not remove await here or anywhere else in the function. It ensures that all errors are caught
            await messageBus.onSetConfiguration(event, (result) => {
                messageBus.sendMessage({
                    type: 'set-configuration-response',
                    correlationId: event.correlationId,
                    ...result,
                });
            });
        } else if (isChargebeeSubmitEvent(event)) {
            await messageBus.onSubmit(event, (result) => {
                messageBus.sendMessage({
                    type: 'chargebee-submit-response',
                    correlationId: event.correlationId,
                    ...result,
                });
            });
        } else if (isSetPaypalPaymentIntentEvent(event)) {
            await messageBus.onSetPaypalPaymentIntent(event, (result) => {
                messageBus.sendMessage({
                    type: 'set-paypal-payment-intent-response',
                    correlationId: event.correlationId,
                    ...result,
                });
            });
        } else if (isGetHeightEvent(event)) {
            await messageBus.onGetHeight(event, (result) => {
                messageBus.sendMessage({
                    type: 'get-height-response',
                    correlationId: event.correlationId,
                    ...result,
                });
            });
        } else if (isGetBinEvent(event)) {
            await messageBus.onGetBin(event, (result) => {
                messageBus.sendMessage({
                    type: 'get-bin-response',
                    correlationId: event.correlationId,
                    ...result,
                });
            });
        } else if (isValidateFormEvent(event)) {
            await messageBus.onValidateForm(event, (result) => {
                messageBus.sendMessage({
                    type: 'validate-form-response',
                    correlationId: event.correlationId,
                    ...result,
                });
            });
        } else if (isVerifySavedCardEvent(event)) {
            await messageBus.onVerifySavedCard(event, (result) => {
                messageBus.sendMessage({
                    type: 'chargebee-verify-saved-card-response',
                    correlationId: event.correlationId,
                    ...result,
                });
            });
        } else if (isChangeRenderModeEvent(event)) {
            await messageBus.onChangeRenderMode(event, (result) => {
                messageBus.sendMessage({
                    type: 'change-render-mode-response',
                    correlationId: event.correlationId,
                    ...result,
                });
            });
        } else if (isChargebeeEvent(event)) {
            // ignore chargebee event
        } else {
            // ignore unknown event
        }
    } catch (error) {
        addCheckpoint('failed_to_handle_parent_message', { error, event });
        messageBus.sendUnhandledErrorMessage(error);
    }
};

export class MessageBus {
    public onSetConfiguration;

    public onSubmit;

    public onSetPaypalPaymentIntent;

    public onGetHeight;

    public onGetBin;

    public onValidateForm;

    public onVerifySavedCard;

    public onChangeRenderMode;

    private eventListener: ((e: MessageEvent) => void) | null = null;

    constructor({
        onSetConfiguration,
        onSubmit,
        onSetPaypalPaymentIntent,
        onGetHeight,
        onGetBin,
        onValidateForm,
        onVerifySavedCard,
        onChangeRenderMode,
    }: ParentMessagesProps) {
        this.onSetConfiguration = onSetConfiguration ?? noop;
        this.onSubmit = onSubmit ?? noop;
        this.onSetPaypalPaymentIntent = onSetPaypalPaymentIntent ?? noop;
        this.onGetHeight = onGetHeight ?? noop;
        this.onGetBin = onGetBin ?? noop;
        this.onValidateForm = onValidateForm ?? noop;
        this.onVerifySavedCard = onVerifySavedCard ?? noop;
        this.onChangeRenderMode = onChangeRenderMode ?? noop;
    }

    initialize() {
        this.eventListener = getEventListener(this);
        window.addEventListener('message', this.eventListener);
    }

    destroy() {
        if (this.eventListener) {
            window.removeEventListener('message', this.eventListener);
            this.eventListener = null;
        }
    }

    sendPaypalAuthorizedMessage(data: PaypalAuthorizedPayload) {
        const message: MessageBusResponse<PaypalAuthorizedPayload> = {
            status: 'success',
            data,
        };

        this.sendMessage({
            type: paypalAuthorizedMessageType,
            ...message,
        });
    }

    sendPaypalFailedMessage(error: any) {
        const message: PaypalFailedMessage = {
            type: paypalFailedMessageType,
            status: 'failure',
            error,
        };

        this.sendMessage(message);
    }

    sendPaypalClickedMessage() {
        const message: PaypalClickedMessage = {
            type: paypalClickedMessageType,
            status: 'success',
            data: {},
        };

        this.sendMessage(message);
    }

    sendPaypalCancelledMessage() {
        const message: PaypalCancelledMessage = {
            type: paypalCancelledMessageType,
            status: 'success',
            data: {},
        };

        this.sendMessage(message);
    }

    send3dsChallengeMessage(data: ThreeDsChallengePayload, correlationId?: string) {
        const message: ThreeDsChallengeMessage = {
            type: threeDsChallengeMessageType,
            status: 'success',
            data,
        };

        this.sendMessage({ ...message, correlationId });
    }

    send3dsFailedMessage(error: any, correlationId?: string) {
        const message: ThreeDsFailedMessage = {
            type: `chargebee-submit-response`,
            status: 'failure',
            error,
        };

        this.sendMessage({ ...message, correlationId });
    }

    sendFormValidationErrorMessage(errors: FormValidationErrors, correlationId?: string) {
        const message: MessageBusResponse<FormValidationErrors> = {
            status: 'failure',
            error: errors,
        };

        this.sendMessage({
            type: 'chargebee-submit-response',
            ...message,
            correlationId,
        });
    }

    send3dsSuccessMessage(paymentIntent: ChargebeeSubmitEventResponse, correlationId?: string) {
        this.sendMessage({
            type: 'chargebee-submit-response',
            status: 'success',
            data: paymentIntent,
            correlationId,
        });
    }

    send3dsRequiredForSavedCardMessage(data: ThreeDsChallengePayload, correlationId?: string) {
        const message: ThreeDsRequiredForSavedCardMessage = {
            type: threeDsChallengeMessageType,
            status: 'success',
            data,
        };

        this.sendMessage({ ...message, correlationId });
    }

    sendSavedCardVerificationSuccessMessage(payload: ChargebeeSavedCardAuthorizationSuccess, correlationId?: string) {
        const message: SavedCardVerificationSuccessMessage = {
            type: 'chargebee-verify-saved-card-response',
            status: 'success',
            data: payload,
        };

        this.sendMessage({ ...message, correlationId });
    }

    sendSavedCardVerificationFailureMessage(error: any, correlationId?: string) {
        const message: SavedCardVerificationFailureMessage = {
            type: 'chargebee-verify-saved-card-response',
            status: 'failure',
            error,
        };

        this.sendMessage({ ...message, correlationId });
    }

    sendUnhandledErrorMessage(errorObj: any) {
        try {
            const error = {
                message: errorObj.message,
                stack: errorObj.stack,
                name: errorObj.name,
                checkpoints: getCheckpoints(),
                chargebeeWrapperVersion,
            };

            const message: UnhandledErrorMessage = {
                type: unhandledError,
                status: 'failure',
                error,
            };

            this.sendMessage(message);
        } catch (error) {
            console.error('Failed to send error message to parent');
            throw error;
        }
    }

    sendMessage(message: {
        type: string;
        correlationId?: string;
        status?: CbIframeResponseStatus;
        data?: any;
        error?: any;
    }) {
        window.parent.postMessage(JSON.stringify(message), '*');
    }
}

let messageBus: MessageBus | null = null;

export function createMessageBus(props: ParentMessagesProps) {
    let parentMessages = new MessageBus(props);
    parentMessages.initialize();

    messageBus = parentMessages;

    return parentMessages;
}

export function getMessageBus(): MessageBus {
    if (!messageBus) {
        throw new Error('MessageBus is not initialized');
    }

    return messageBus;
}
