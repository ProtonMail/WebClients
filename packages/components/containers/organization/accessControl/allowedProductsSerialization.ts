import { Product } from '@proton/shared/lib/ProductEnum';
import type {
    OrganizationSettingsAllowedProduct,
    SerializedOrganizationSettingsAllowedProduct,
} from '@proton/shared/lib/interfaces';

export const allSupportedAccessControlProducts: OrganizationSettingsAllowedProduct[] = [
    Product.Mail,
    Product.Calendar,
    Product.Drive,
    Product.VPN,
    Product.Pass,
    Product.Wallet,
];

export const serializeAllowedProducts = (
    allowedProducts: Set<OrganizationSettingsAllowedProduct>
): SerializedOrganizationSettingsAllowedProduct[] => {
    if (allSupportedAccessControlProducts.some((application) => !allowedProducts.has(application))) {
        return [...allowedProducts.values()];
    }
    return ['All'];
};

export const deserializeAllowedProducts = (
    allowedProducts: SerializedOrganizationSettingsAllowedProduct[]
): Set<OrganizationSettingsAllowedProduct> => {
    const serializedAllowedProductsSet = new Set(allowedProducts);

    if (serializedAllowedProductsSet.has('All')) {
        return new Set(allSupportedAccessControlProducts);
    }

    const allowedProductsSet = new Set<OrganizationSettingsAllowedProduct>();
    serializedAllowedProductsSet.forEach((serialisedProduct) => {
        if (serialisedProduct === 'All') {
            return;
        }

        allowedProductsSet.add(serialisedProduct);
    });

    return allowedProductsSet;
};
