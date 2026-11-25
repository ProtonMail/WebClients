import type { FeatureFlag} from '@proton/unleash/Flags';

import type { StaticExperimentConfig } from './types';

const GERMAN_TIME_ZONES = ['Europe/Berlin', 'Europe/Busingen'];

export const staticExperimentsConfig = {
    PaypalFirst: {
        enabled: () => {
            try {
                const { timeZone } = Intl.DateTimeFormat().resolvedOptions();

                return GERMAN_TIME_ZONES.includes(timeZone);
            } catch {
                return false;
            }
        },
        owner: 'payments',
        schedule: [
            {
                startsAt: '2026-11-12T00:00:00.000Z',
                endsAt: '2026-12-31T00:00:00.000Z',
                weights: { with: 50, without: 50 },
            },
        ],
    },
    /**
     * VPN signup: Free, VPN Plus and Proton Unlimited cards instead of the VPN Plus cycle selector.
     * Only the default B2C pricing page takes part, see `useVpnSignupThreePlans`.
     * Works as an on/off switch: the cards are only shown with `Treatment` and on links with `?v=b`,
     * Growth splits the traffic between links. Turn it on with `{ Control: 0, Treatment: 100 }`,
     * which needs an MR and a release.
     */
    VpnSignupThreePlans: {
        enabled: true,
        owner: 'jpratvil',
        schedule: [
            {
                startsAt: '2026-11-19T00:00:00.000Z',
                weights: { Control: 100, Treatment: 0 },
            },
        ],
    },
} satisfies Record<string, StaticExperimentConfig> & Partial<Record<FeatureFlag, never>>;
