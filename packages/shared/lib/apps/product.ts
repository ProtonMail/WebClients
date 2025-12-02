import type { APP_NAMES } from '@proton/shared/lib/constants';

import { captureMessage } from '../helpers/sentry';

export const otherProductParamValues = ['generic', 'business'] as const;
export type OtherProductParam = (typeof otherProductParamValues)[number];
export type ProductParam = APP_NAMES | OtherProductParam | undefined;

type AllowedProductHeaders =
    | '' // Empty string is a placeholder for web apps that aren't supposed to be attributed with any BU and that
    // aren't supposed to make any sales. If you're actually introducing a new product that should participate in
    // revenue recognition, then make sure to create a new allowed value below.
    | 'mail'
    | 'calendar'
    | 'drive'
    | 'pass'
    | 'wallet'
    | 'lumo'
    | 'meet'
    | 'vpn'
    | 'business'
    | 'generic';

export const productParamToHeader: { [key in NonNullable<ProductParam>]: AllowedProductHeaders } = {
    'proton-account': '', // Account is intentionally not generic since we want to catch these cases
    'proton-account-lite': '',
    'proton-admin': '',
    'proton-authenticator': 'pass',
    'proton-calendar': 'calendar',
    'proton-contacts': 'mail',
    'proton-docs': 'drive',
    'proton-docs-editor': 'drive',
    'proton-drive': 'drive',
    'proton-extension': 'pass',
    'proton-lumo': 'lumo',
    'proton-mail': 'mail',
    'proton-meet': 'meet',
    'proton-pass': 'pass',
    'proton-pass-extension': 'pass',
    'proton-sheets': 'drive',
    'proton-sheets-editor': 'drive',
    'proton-verify': '',
    'proton-vpn-browser-extension': 'vpn',
    'proton-vpn-settings': 'vpn',
    'proton-wallet': 'wallet',
    business: 'business',
    generic: 'generic',
};

export const normalizeProduct = (product: ProductParam) => {
    if (!product) {
        return;
    }
    const normalizedProduct = productParamToHeader[product];
    if (!normalizedProduct) {
        return;
    }
    return normalizedProduct;
};

export interface ProductHeaderContext {
    endpoint?: string;
    product?: any;
    emptyProduct?: boolean;
}

function notifySentry(
    normalizedProduct: string | undefined,
    productParam: ProductParam,
    maybeContext?: ProductHeaderContext
) {
    let context = maybeContext;
    if (!productParam) {
        context = { ...context, emptyProduct: true };
    }
    captureMessage('Wrong product header', { level: 'error', extra: { normalizedProduct, productParam, context } });
}

export const getProductHeaders = (product: ProductParam, context?: ProductHeaderContext) => {
    const normalizedProduct = normalizeProduct(product);
    if (!normalizedProduct) {
        notifySentry(normalizedProduct, product, context);
        return;
    }
    return { 'x-pm-product': normalizedProduct };
};
