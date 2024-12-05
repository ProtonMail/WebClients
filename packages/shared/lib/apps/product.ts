import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';

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
    // Docs is a sub-product of drive and doesn't have its own attribution as of now, so use drive
    if (product === APPS.PROTONDOCS) {
        return 'drive';
    }
    return product.replace('proton-', '');
};

export interface ProductHeaderContext {
    endpoint?: string;
    product?: any;
    emptyProduct?: boolean;
}

function notifySentry(normalizedProduct: string | undefined, context?: ProductHeaderContext) {
    const isAllowed = ['generic', 'mail', 'drive', 'calendar', 'vpn', 'business', 'pass', 'wallet'].includes(
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

    if (normalizedProduct === undefined) {
        return;
    }
    return { 'x-pm-product': normalizedProduct };
};
