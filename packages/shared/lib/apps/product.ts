import { APPS, APP_NAMES } from '@proton/shared/lib/constants';

export const otherProductParamValues = ['generic', 'business'] as const;
export type OtherProductParam = typeof otherProductParamValues[number];
export type ProductParam = APP_NAMES | OtherProductParam | 'none' | undefined;

const normalizeProduct = (product: ProductParam) => {
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

export const getProductHeaders = (product: ProductParam) => {
    if (!product) {
        return;
    }
    return { 'x-pm-product': normalizeProduct(product) };
};
