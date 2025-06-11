import { Product } from '@proton/shared/lib/ProductEnum';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import type {
    OrganizationSettingsAllowedProduct,
    SerializedOrganizationSettingsAllowedProduct,
} from '@proton/shared/lib/interfaces';

// A mapping of what the API returns in OrganizationSettingsAllowedProduct to app names
const productsToApps: Record<OrganizationSettingsAllowedProduct, APP_NAMES[]> = {
    // Mail is bundled together with calendar, and returned as two separate entities
    [Product.Mail]: [APPS.PROTONMAIL, APPS.PROTONCALENDAR],
    // Calendar is bundled together with mail, and returned as two separate entities
    [Product.Calendar]: [APPS.PROTONMAIL, APPS.PROTONCALENDAR],
    // Drive is bundled together with docs, and docs is _not_ returned
    [Product.Drive]: [APPS.PROTONDRIVE, APPS.PROTONDOCS],
    [Product.Pass]: [APPS.PROTONPASS],
    [Product.Wallet]: [APPS.PROTONWALLET],
    [Product.VPN]: [APPS.PROTONVPN_SETTINGS],
    [Product.Lumo]: [APPS.PROTONLUMO],
} as const;

// This constant contains a set of all the products that are supported in the access control feature
export const allAllowedProducts = new Set(Object.keys(productsToApps) as (keyof typeof productsToApps)[]);

/**
 * Serializes a set of allowed products into an array of strings
 * Specifically, it converts the set of all allowed products into 'All'
 */
export const serializeAllowedProducts = (
    allowedProducts: Set<OrganizationSettingsAllowedProduct>
): SerializedOrganizationSettingsAllowedProduct[] => {
    if (!allAllowedProducts.difference(allowedProducts).size) {
        return ['All'];
    }
    return [...allowedProducts.values()];
};

/**
 * Deserializes a set of serialized products into a set of products.
 * Specifically, it strips 'All' and converts that into the set of all allowed products.
 */
export const deserializeAllowedProducts = (
    allowedProducts: SerializedOrganizationSettingsAllowedProduct[] | undefined
): Set<OrganizationSettingsAllowedProduct> => {
    if (!allowedProducts) {
        return allAllowedProducts;
    }
    const serializedAllowedProductsSet = new Set(allowedProducts);
    if (serializedAllowedProductsSet.has('All')) {
        return allAllowedProducts;
    }
    if (!allAllowedProducts.difference(serializedAllowedProductsSet).size) {
        return allAllowedProducts;
    }
    return serializedAllowedProductsSet as Set<OrganizationSettingsAllowedProduct>;
};

export const getAreAllProductsAllowed = (value: ReturnType<typeof deserializeAllowedProducts>) => {
    return value === allAllowedProducts || allAllowedProducts.difference(value).size === 0;
};

/**
 * Converts a set of Product into a set of APP_NAME
 */
export const getAppNameSetFromProductSet = (apps: Set<OrganizationSettingsAllowedProduct>): Set<APP_NAMES> => {
    return new Set(
        Array.from(apps).flatMap((product) => {
            return productsToApps[product];
        })
    );
};
