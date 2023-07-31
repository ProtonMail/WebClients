import { APPS, APP_NAMES } from '@proton/shared/lib/constants';

import { captureMessage } from '../helpers/sentry';

export const otherProductParamValues = ['generic', 'business'] as const;
export type OtherProductParam = (typeof otherProductParamValues)[number];
export type ProductParam = APP_NAMES | OtherProductParam | undefined;

export const normalizeProduct = (product: ProductParam) => {
    if (!product) {
        return;
    }
    // Converts:
    // proton-mail -> mail
    // proton-vpn-settings -> vpn
    if (product === APPS.PROTONVPN_SETTINGS) {
        return 'vpn';
    }
    return product.replace('proton-', '');
};

export interface ProductHeaderContext {
    endpoint?: string;
    product?: any;
    emptyProduct?: boolean;
}

function notifySentry(normalizedProduct: string | undefined, context?: ProductHeaderContext) {
    const isAllowed = ['generic', 'mail', 'drive', 'calendar', 'vpn', 'business', 'pass'].includes(
        '' + normalizedProduct
    );
    if (!isAllowed) {
        captureMessage('Wrong product header', { level: 'error', extra: { normalizedProduct, context } });
    }
}

export const getProductHeaders = (product: ProductParam, context?: ProductHeaderContext) => {
    if (!product) {
        notifySentry(undefined, {
            ...context,
            emptyProduct: true,
        });
        return;
    }
    const normalizedProduct = normalizeProduct(product);
    notifySentry(normalizedProduct, context);

    return { 'x-pm-product': normalizedProduct };
};
