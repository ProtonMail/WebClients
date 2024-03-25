import { getCookies } from '@proton/shared/lib/helpers/cookies';

export enum ExperimentCode {
    VpnIntroPricing = 'VpnIntroPricing',
}

export enum VPNIntroPricingVariant {
    Old2022,
    New2024,
}

let variant: VPNIntroPricingVariant | null = null;

export const getVPNIntroPricingVariant = () => {
    if (variant !== null) {
        return variant;
    }
    const getValue = () => {
        const value = getCookies().some((cookie) => {
            return cookie.includes('VpnIntroPricing:B');
        });
        return value ? VPNIntroPricingVariant.New2024 : VPNIntroPricingVariant.Old2022;
    };
    return (variant = getValue());
};
