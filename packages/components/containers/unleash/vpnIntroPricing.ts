import { IVariant } from 'unleash-proxy-client';

export enum ExperimentCode {
    VpnIntroPricing = 'VpnIntroPricing',
}

export enum VPNIntroPricingVariant {
    Old2022,
    New2024,
}

export const getVPNIntroPricingVariant = (variant: Partial<IVariant>) => {
    return variant?.enabled && variant.name === 'B' ? VPNIntroPricingVariant.New2024 : VPNIntroPricingVariant.Old2022;
};
