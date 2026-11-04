import { EntitlementName } from './entitlement-names';

export type ProductFlag = Extract<EntitlementName, `flags-${string}`>;

export const isProductFlag = (name: EntitlementName): name is ProductFlag => name.startsWith('flags-');

const productFlags = Object.values(EntitlementName).filter(isProductFlag);

export const getProductFlagsOtherThan = (...keptFlags: ProductFlag[]): ProductFlag[] =>
    productFlags.filter((flag) => !keptFlags.includes(flag));
