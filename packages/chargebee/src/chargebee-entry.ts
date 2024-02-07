import {
    AuthorizedPaymentIntent,
    CbCardConfig,
    CbIframeConfig,
    FormValidationErrors,
    MessageBusResponse,
    PaymentIntent,
} from '../lib';
import { createChargebee, getChargebeeInstance } from './chargebee';
import { getConfiguration, setConfiguration } from './configuration';
import {
    ChangeRenderModeEvent,
    ChargebeeSubmitEvent,
    OnChangeRenderModeHandler,
    OnGetBinHandler,
    OnSetPaypalPaymentIntentHandler,
    OnValidateFormHandler,
    OnVerifySavedCardHandler,
    SetPaypalPaymentIntentEvent,
    createMessageBus,
    getMessageBus,
} from './message-bus';
// eslint-disable-next-line import/no-unresolved
import cardTemplateString from './templates/card.html?raw';
// eslint-disable-next-line import/no-unresolved
import paypalTemplateString from './templates/paypal.html?raw';
// eslint-disable-next-line import/no-unresolved
import warningIcon from './templates/warningicon.html?raw';
import { trackFocus } from './ui-utils';

function getChargebeeFormWrapper(): HTMLElement {
    const chargebeeFormWrapper = document.getElementById('chargebee-form-wrapper');
    if (!chargebeeFormWrapper) {
        throw new Error('Chargebee form wrapper not found');
    }

    return chargebeeFormWrapper;
}

function setTemplate(template: string) {
    getChargebeeFormWrapper().innerHTML = template;
}

function getCssVariable(name: string): string {
    const root = document.documentElement;
    const value = getComputedStyle(root).getPropertyValue(name);
    return value;
}

function hideError(element: HTMLDivElement) {
    element.innerHTML = '';
}

function renderError(element: HTMLDivElement, error: string) {
    element.innerHTML = `
        ${warningIcon}
        <span>${error}</span>    
    `;
}

function setCardFormRenderMode() {
    const renderMode = (getConfiguration() as CbCardConfig).renderMode;

    const cardInputElement = document.querySelector('.card-input') as HTMLDivElement;
    cardInputElement.classList.remove('card-input--one-line');
    cardInputElement.classList.remove('card-input--two-line');
    cardInputElement.classList.add(`card-input--${renderMode}`);
}

function setCssVariables() {
    const cssVariables = (getConfiguration() as CbCardConfig).cssVariables;

    const root = document.documentElement;
    for (const [key, value] of Object.entries(cssVariables)) {
        root.style.setProperty(key, value);
    }
}

function getTranslation(key: keyof CbCardConfig['translations']): string {
    const translations = (getConfiguration() as CbCardConfig).translations;
    return translations[key];
}

async function renderCreditCardForm() {
    setTemplate(cardTemplateString);
    setCardFormRenderMode();
    setCssVariables();

    const cbInstance = getChargebeeInstance();

    await cbInstance.load('components');

    const fontFamily = `'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Oxygen-Sans,
    Ubuntu,
    Cantarell,
    'Helvetica Neue',
    sans-serif`;

    const cardComponent = cbInstance.createComponent('card', {
        icon: false,
        classes: {
            focus: 'focus',
            invalid: 'invalid',
            empty: 'empty',
            complete: 'complete',
        },
        // Avoid loading fonts from external sources, hence
        // todo: load fonts from the local instance of frontend
        // fonts: ['https://fonts.googleapis.com/css2?family=Inter&display=swap'],
        style: {
            fontFamily,
        },
    });

    const sharedOptions = {
        style: {
            base: {
                '::placeholder': {
                    color: getCssVariable('--field-placeholder-color'),
                },
                ':focus': {
                    color: getCssVariable('--field-focus-text-color'),
                },
                fontFamily,
                color: getCssVariable('--field-text-color'),
            },
            invalid: {
                color: 'inherit',
            },
        },
    };

    const numberSelector = '#card-number';
    const number = cardComponent
        .createField('number', {
            placeholder: getTranslation('cardNumberPlaceholder'),
            ...sharedOptions,
        })
        .at(numberSelector);
    trackFocus(numberSelector, number);

    const expirySelector = '#card-expiry';
    const expiry = cardComponent
        .createField('expiry', {
            ...sharedOptions,
            placeholder: getTranslation('cardExpiryPlaceholder'),
        })
        .at(expirySelector);
    trackFocus(expirySelector, expiry);

    const cvcSelector = '#card-cvc';
    const cvc = cardComponent
        .createField('cvv', {
            placeholder: getTranslation('cardCvcPlaceholder'),
            ...sharedOptions,
        })
        .at(cvcSelector);
    trackFocus(cvcSelector, cvc);

    await cardComponent.mount();

    function validateFormWithoutRendering(): FormValidationErrors {
        const errors = [];

        if (!number.status.isValid) {
            const message = getTranslation('invalidCardNumberMessage');

            errors.push({
                message,
                error: 'INVALID_CARD_NUMBER',
            });
        }

        if (!expiry.status.isValid) {
            const message = getTranslation('invalidCardExpiryMessage');

            errors.push({
                message,
                error: 'INVALID_EXPIRATION_DATE',
            });
        }

        if (!cvc.status.isValid) {
            const message = getTranslation('invalidCardCvcMessage');

            errors.push({
                message,
                error: 'INVALID_CVC',
            });
        }

        return errors.length === 0 ? null : errors;
    }

    function renderIconErrors(errors: { message: string; error: string }[] | null) {
        const iconErrorSelector = '.icon-error';
        const iconErrorElements = document.querySelectorAll(iconErrorSelector);
        for (const iconErrorElement of iconErrorElements) {
            iconErrorElement.remove();
        }

        const renderMode = (getConfiguration() as CbCardConfig).renderMode;
        if (renderMode === 'one-line' || !errors || errors.length === 0) {
            return;
        }

        for (const error of errors) {
            const inputElement = (() => {
                switch (error.error) {
                    case 'INVALID_CARD_NUMBER':
                        return document.querySelector(numberSelector) as HTMLDivElement;
                    case 'INVALID_EXPIRATION_DATE':
                        return document.querySelector(expirySelector) as HTMLDivElement;
                    case 'INVALID_CVC':
                        return document.querySelector(cvcSelector) as HTMLDivElement;
                    default:
                        return null;
                }
            })();

            if (!inputElement) {
                continue;
            }

            const iconErrorElement = document.createElement('div');
            iconErrorElement.classList.add('icon-error');
            iconErrorElement.innerHTML = warningIcon;
            inputElement.appendChild(iconErrorElement);
        }
    }

    function renderErrors(errors: { message: string; error: string }[] | null) {
        renderIconErrors(errors);

        const numberErrorElement = document.querySelector('#card-number-error') as HTMLDivElement;
        const expiryErrorElement = document.querySelector('#card-expiry-error') as HTMLDivElement;
        const cvcErrorElement = document.querySelector('#card-cvc-error') as HTMLDivElement;

        const errorElements = [numberErrorElement, expiryErrorElement, cvcErrorElement];
        for (const errorElement of errorElements) {
            hideError(errorElement);
        }

        if (!errors || errors.length === 0) {
            return;
        }

        const error = errors[0];
        switch (error.error) {
            case 'INVALID_CARD_NUMBER':
                renderError(numberErrorElement, error.message);
                break;
            case 'INVALID_EXPIRATION_DATE':
                renderError(expiryErrorElement, error.message);
                break;
            case 'INVALID_CVC':
                renderError(cvcErrorElement, error.message);
                break;
            default:
                break;
        }
    }

    let hasEventListeners = false;
    function enableFormValidation() {
        const errors = validateFormWithoutRendering();
        renderErrors(errors);

        if (!hasEventListeners) {
            cardComponent.on('change', () => {
                const errors = validateFormWithoutRendering();
                renderErrors(errors);
            });

            hasEventListeners = true;
        }

        return errors;
    }

    type ThreeDsAdditionalData = {
        billingAddress: {
            countryCode: string;
            zip?: string;
        };
    };

    function getAdditionalData({ countryCode, zip }: ThreeDsAdditionalData['billingAddress']): ThreeDsAdditionalData {
        const additionalData: ThreeDsAdditionalData = {
            billingAddress: {
                countryCode,
            },
        };

        const countiesWithZip = ['US'];
        if (countiesWithZip.includes(countryCode)) {
            additionalData.billingAddress.zip = zip;
        }

        return additionalData;
    }

    function handleSubmit({ paymentIntent, zip, countryCode, correlationId }: ChargebeeSubmitEvent): void {
        const messageBus = getMessageBus();

        const errors = enableFormValidation();
        if (errors) {
            messageBus.sendFormValidationErrorMessage(errors, correlationId);
            return;
        }

        const additionalData = getAdditionalData({ countryCode, zip });

        cardComponent
            .authorizeWith3ds(paymentIntent, additionalData, {
                challenge: (url: string) => {
                    messageBus.send3dsChallengeMessage(
                        {
                            url,
                        },
                        correlationId
                    );
                },
            })
            .then((authorizedPaymentIntent: AuthorizedPaymentIntent) => {
                messageBus.send3dsSuccessMessage(
                    {
                        authorized: true,
                        authorizedPaymentIntent,
                    },
                    correlationId
                );
            })
            .catch((error: any) => {
                messageBus.send3dsFailedMessage(error, correlationId);
            });
    }

    getMessageBus().onSubmit = handleSubmit;

    const onGetBinHandler: OnGetBinHandler = async (_, sendResponseToParent) => {
        const data = cardComponent.getBinData();
        sendResponseToParent({
            status: 'success',
            data,
        });
    };
    getMessageBus().onGetBin = onGetBinHandler;

    const onValidateFormHandler: OnValidateFormHandler = async (_, sendResponseToParent) => {
        const errors = enableFormValidation();
        sendResponseToParent({
            status: 'success',
            data: errors,
        });
    };
    getMessageBus().onValidateForm = onValidateFormHandler;

    const onChangeRenderMode: OnChangeRenderModeHandler = async (
        event: ChangeRenderModeEvent,
        sendResponseToParent
    ) => {
        const { renderMode } = event;
        const configuration = getConfiguration() as CbCardConfig;
        setConfiguration({
            ...configuration,
            renderMode,
        });

        setCardFormRenderMode();

        sendResponseToParent({
            status: 'success',
            data: {},
        });
    };
    getMessageBus().onChangeRenderMode = onChangeRenderMode;
}

async function renderPaypal() {
    setTemplate(paypalTemplateString);

    const paypalHandler = await getChargebeeInstance().load('paypal');

    const handlePaypalPayment = () => {
        paypalHandler
            .handlePayment({
                success: (result: AuthorizedPaymentIntent) => {
                    getMessageBus().sendPaypalAuthorizedMessage({
                        paymentIntent: result,
                    });
                },
                error: (_: PaymentIntent, error: any) => {
                    getMessageBus().sendPaypalFailedMessage(error);
                },
                click: () => {
                    getMessageBus().sendPaypalClickedMessage();
                },
                cancel: () => {
                    getMessageBus().sendPaypalCancelledMessage();
                },
            })
            .catch(() => {});
    };

    const handleSetPaypalPaymentIntent = async (
        event: SetPaypalPaymentIntentEvent
    ): Promise<MessageBusResponse<void>> => {
        try {
            const { paymentIntent } = event;
            paypalHandler.setPaymentIntent(paymentIntent);

            const defaultPaypalButtonHeight = 36;
            const height = event.paypalButtonHeight ?? defaultPaypalButtonHeight;
            await paypalHandler.mountPaymentButton('#paypal-button', {
                style: {
                    height,
                },
            });

            void handlePaypalPayment();

            return {
                status: 'success',
                data: undefined,
            };
        } catch (error) {
            return {
                status: 'failure',
                error,
            };
        }
    };

    const onSetPaypalPaymentIntent: OnSetPaypalPaymentIntentHandler = async (event, sendResponseToParent) => {
        const response = await handleSetPaypalPaymentIntent(event);
        sendResponseToParent(response);
    };

    getMessageBus().onSetPaypalPaymentIntent = onSetPaypalPaymentIntent;
}

async function renderSavedCard() {
    let cbInstance = getChargebeeInstance();
    const threeDSHandler = await cbInstance.load3DSHandler();
    const messageBus = getMessageBus();

    const onVerifySavedCard: OnVerifySavedCardHandler = async ({ correlationId, paymentIntent }) => {
        delete (paymentIntent as any).gateway_account_id;

        threeDSHandler.setPaymentIntent(paymentIntent);
        threeDSHandler
            .handleCardPayment(undefined, {
                challenge: (url: string) => {
                    messageBus.send3dsRequiredForSavedCardMessage({ url }, correlationId);
                },
            })
            .then((authorizedPaymentIntent: AuthorizedPaymentIntent) => {
                messageBus.sendSavedCardVerificationSuccessMessage(
                    {
                        authorized: true,
                        authorizedPaymentIntent,
                    },
                    correlationId
                );
            })
            .catch((error: any) => {
                messageBus.sendSavedCardVerificationFailureMessage(error, correlationId);
            });
    };

    getMessageBus().onVerifySavedCard = onVerifySavedCard;
}

async function cbInit() {
    if (getConfiguration().paymentMethodType === 'card') {
        await renderCreditCardForm();
    } else if (getConfiguration().paymentMethodType === 'paypal') {
        await renderPaypal();
    } else if (getConfiguration().paymentMethodType === 'saved-card') {
        await renderSavedCard();
    }
}

async function setConfigurationAndCreateChargebee(configuration: CbIframeConfig) {
    setConfiguration(configuration);
    const cbInstance = createChargebee({
        site: configuration.site,
        publishableKey: configuration.publishableKey,
        domain: configuration.domain,
    });

    await cbInit();

    return cbInstance;
}

function handleError(error: any) {
    try {
        const messageBus = getMessageBus();
        messageBus.sendUnhandledErrorMessage(error);
    } catch {
        console.error('Failed to send error message to parent');
        throw error;
    }
}

export async function initialize() {
    try {
        window.addEventListener('error', (event) => {
            event.preventDefault();
            handleError(event.error);
        });

        let promiseResolve!: (value: unknown) => void;
        let promiseReject!: (reason?: any) => void;
        const cbInstancePromise = new Promise<any>((resolve, reject) => {
            promiseResolve = resolve;
            promiseReject = reject;
        });

        const rejectInterval = setInterval(() => {
            promiseReject("Chargebee wasn't initialized");
        }, 60000);

        createMessageBus({
            onSetConfiguration: async (configuration, sendResponseToParent) => {
                const cbInstance = await setConfigurationAndCreateChargebee(configuration);
                clearInterval(rejectInterval);
                promiseResolve(cbInstance);
                sendResponseToParent({
                    status: 'success',
                    data: {},
                });
            },
            onGetHeight: (_, sendResponseToParent) => {
                const extraBottom = 36;

                sendResponseToParent({
                    status: 'success',
                    data: {
                        height: document.body.scrollHeight + extraBottom,
                        extraBottom,
                    },
                });
            },
        });

        return await cbInstancePromise;
    } catch (error: any) {
        handleError(error);
    }
}
