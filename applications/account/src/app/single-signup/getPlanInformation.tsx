import type { ReactNode } from 'react';

import { c, msgid } from 'ttag';

import { SkeletonLoader, VpnLogo } from '@proton/components';
import { getCalendarAppFeature } from '@proton/components/containers/payments/features/calendar';
import { getDriveAppFeature } from '@proton/components/containers/payments/features/drive';
import type { PlanCardFeatureDefinition } from '@proton/components/containers/payments/features/interface';
import { getMailAppFeature } from '@proton/components/containers/payments/features/mail';
import {
    get2FAAuthenticator,
    getDarkWebMonitoring,
    getHideMyEmailAliases,
    getItems,
    getLoginsAndNotes,
    getPassAppFeature,
    getPasswordHealth,
} from '@proton/components/containers/payments/features/pass';
import {
    getAdvancedVPNCustomizations,
    getAllPlatforms,
    getBandwidth,
    getCountries,
    getNetShield,
    getNoAds,
    getPrioritySupport,
    getProtectDevices,
    getRefundable,
    getStreaming,
    getVPNAppFeature,
    getVPNSpeed,
} from '@proton/components/containers/payments/features/vpn';
import { getWalletAppFeature } from '@proton/components/containers/payments/features/wallet';
import FreeLogo from '@proton/components/containers/payments/subscription/FreeLogo/FreeLogo';
import type { IconSize } from '@proton/icons';
import { PLANS, type Plan } from '@proton/payments';
import { getFreeTitle } from '@proton/shared/lib/apps/i18n';
import { APPS, BRAND_NAME, PASS_APP_NAME, VPN_APP_NAME, VPN_CONNECTIONS } from '@proton/shared/lib/constants';
import type { VPNServersCountData } from '@proton/shared/lib/interfaces';
import { getFreeServers, getPlusServers } from '@proton/shared/lib/vpn/features';
import { CSS_BASE_UNIT_SIZE } from '@proton/styles/index';
import isTruthy from '@proton/utils/isTruthy';

import bundleVpnPass from '../single-signup-v2/bundle-vpn-pass.svg';
import bundle from '../single-signup-v2/bundle.svg';
import VpnProLogo from './VpnProLogo';

export interface PlanInformation {
    logo: ReactNode;
    title: string;
    features: PlanCardFeatureDefinition[];
    bundle?: {
        title: string;
        features: PlanCardFeatureDefinition[];
    }[];
}

export const getPlanInformation = ({
    loading,
    selectedPlan,
    vpnServersCountData,
    mode,
}: {
    loading: boolean;
    selectedPlan: Plan;
    vpnServersCountData: VPNServersCountData;
    mode: 'pricing' | 'signup' | 'vpn-pass-promotion';
}): PlanInformation | undefined => {
    const iconSize: IconSize = 7;
    const iconImgSize = iconSize * CSS_BASE_UNIT_SIZE;
    const countryPlaceholder: PlanCardFeatureDefinition | null = loading
        ? {
              text: <SkeletonLoader width="6em" />,
              included: true,
          }
        : null;

    if (selectedPlan.Name === PLANS.FREE) {
        const freeServers = getFreeServers(vpnServersCountData.free.servers, vpnServersCountData.free.countries);
        return {
            logo: <FreeLogo size={iconImgSize} app={APPS.PROTONVPN_SETTINGS} />,
            title: getFreeTitle(BRAND_NAME),
            features: [countryPlaceholder || getCountries(freeServers), getNoAds(), getBandwidth()],
        };
    }

    if (selectedPlan.Name === PLANS.VPN || selectedPlan.Name === PLANS.VPN2024) {
        const plusServers = getPlusServers(vpnServersCountData.paid.servers, vpnServersCountData.paid.countries);
        const pricingMode = mode === 'pricing' || mode === 'vpn-pass-promotion';
        return {
            logo: <VpnLogo variant="glyph-only" size={iconSize} />,
            title: selectedPlan.Title,
            features: [
                pricingMode ? countryPlaceholder || getCountries(plusServers) : undefined,
                getVPNSpeed('highest'),
                pricingMode ? getStreaming(true) : undefined,
                getProtectDevices(VPN_CONNECTIONS),
                getAllPlatforms(),
                getNetShield(true),
                mode === 'signup' ? getStreaming(true) : undefined,
                getPrioritySupport(),
                getAdvancedVPNCustomizations(true),
                pricingMode ? getRefundable() : undefined,
            ].filter(isTruthy),
        };
    }

    if (selectedPlan.Name === PLANS.BUNDLE) {
        return {
            logo: (
                <div>
                    <img src={bundle} width={iconImgSize} height={iconImgSize} alt={selectedPlan.Title} />
                </div>
            ),
            title: selectedPlan.Title,
            features: [
                getMailAppFeature(),
                getCalendarAppFeature(),
                getDriveAppFeature(),
                getVPNAppFeature({ serversCount: vpnServersCountData }),
                getPassAppFeature(),
                getWalletAppFeature(),
            ],
        };
    }

    if (selectedPlan.Name === PLANS.VPN_PASS_BUNDLE) {
        return {
            logo: (
                <div>
                    <img src={bundleVpnPass} width={iconImgSize} height={iconImgSize} alt={selectedPlan.Title} />
                </div>
            ),
            title: selectedPlan.Title,
            features: [],
            bundle: [
                {
                    title: `${VPN_APP_NAME} Plus`,
                    features: [
                        getVPNSpeed('highest'),
                        getProtectDevices(VPN_CONNECTIONS),
                        getNetShield(true),
                        getAdvancedVPNCustomizations(true),
                    ],
                },
                {
                    title: `${PASS_APP_NAME} Plus`,
                    features: [
                        getLoginsAndNotes('paid'),
                        getHideMyEmailAliases('unlimited'),
                        get2FAAuthenticator(true),
                        getItems(),
                        getDarkWebMonitoring(),
                        getPasswordHealth(),
                    ],
                },
            ],
        };
    }

    const serversInNCountries = c('new_plans: feature').ngettext(
        msgid`Servers in ${vpnServersCountData.paid.countries}+ country`,
        `Servers in ${vpnServersCountData.paid.countries}+ countries`,
        vpnServersCountData.paid.countries
    );

    if (selectedPlan.Name === PLANS.VPN_PRO) {
        return {
            logo: <VpnProLogo size={iconSize} />,
            title: selectedPlan.Title,
            features: [
                {
                    text: c('new_plans: feature').t`Advanced network security`,
                    included: true,
                },
                countryPlaceholder || {
                    text: serversInNCountries,
                    included: true,
                },
                {
                    text: c('new_plans: feature').t`24/7 support`,
                    included: true,
                },
                {
                    text: c('new_plans: feature').t`Centralized settings and billings`,
                    included: true,
                },
            ],
        };
    }

    if (selectedPlan.Name === PLANS.VPN_BUSINESS) {
        return {
            logo: <VpnLogo variant="glyph-only" size={iconSize} />,
            title: selectedPlan.Title,
            features: [
                {
                    text: c('new_plans: feature').t`Advanced network security`,
                    included: true,
                },
                countryPlaceholder || {
                    text: serversInNCountries,
                    included: true,
                },
                {
                    text: c('new_plans: feature').t`Dedicated servers and IP`,
                    included: true,
                },
                {
                    text: c('new_plans: feature').t`24/7 support`,
                    included: true,
                },
                {
                    text: c('new_plans: feature').t`Centralized settings and billings`,
                    included: true,
                },
            ],
        };
    }
};
