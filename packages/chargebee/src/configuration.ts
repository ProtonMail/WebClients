import { sanitizeChargebeeCssVariables } from '../lib/css-variables';
import { sanitizeObject } from '../lib/sanitize-object';
import {
    type CbApplePayConfig,
    type CbCardConfig,
    type CbDirectDebitConfig,
    type CbGooglePayConfig,
    type CbIdealConfig,
    type CbIframeConfig,
    type CbPaypalConfig,
    type CbSavedCardConfig,
    type Translations,
    translationKeysSet,
} from '../lib/types';

let configuration: CbIframeConfig | null = null;

export function getConfiguration(): CbIframeConfig {
    if (!configuration) {
        throw new Error('Configuration is not set');
    }
    return configuration;
}

function sanitizeSharedConfig(configInput: CbIframeConfig) {
    const allowedKeys = new Set(['paymentMethodType', 'publishableKey', 'site', 'domain', 'themeType'] as const);
    return sanitizeObject(configInput, allowedKeys);
}

function getCardConfiguration(configInput: CbCardConfig): CbIframeConfig {
    const sharedConfig = sanitizeSharedConfig(configInput);

    const cardProps: Partial<CbCardConfig> = {};

    const allowedRenderModes: CbCardConfig['renderMode'][] = ['one-line', 'two-line'];
    if (configInput.renderMode && allowedRenderModes.includes(configInput.renderMode)) {
        cardProps.renderMode = configInput.renderMode;
    }

    cardProps.cssVariables = sanitizeChargebeeCssVariables(configInput.cssVariables);

    cardProps.translations = sanitizeObject<Translations>(configInput.translations, translationKeysSet);

    return { ...sharedConfig, ...cardProps };
}

function getConfigWithoutExtraProperties(
    configInput:
        CbPaypalConfig | CbSavedCardConfig | CbDirectDebitConfig | CbApplePayConfig | CbGooglePayConfig | CbIdealConfig
): CbIframeConfig {
    return sanitizeSharedConfig(configInput);
}

export function setConfiguration(config: CbIframeConfig) {
    const allowedPaymentMethodTypes: CbIframeConfig['paymentMethodType'][] = [
        'card',
        'paypal',
        'saved-card',
        'direct-debit',
        'apple-pay',
        'google-pay',
        'ideal',
    ];

    if (!config || !config.paymentMethodType || !allowedPaymentMethodTypes.includes(config.paymentMethodType)) {
        console.error('Invalid configuration type', config?.paymentMethodType);
        return;
    }

    if (config.paymentMethodType === 'card') {
        configuration = getCardConfiguration(config);
    } else {
        configuration = getConfigWithoutExtraProperties(config);
    }
}
