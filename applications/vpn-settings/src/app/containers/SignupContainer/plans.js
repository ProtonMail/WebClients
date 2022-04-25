import { c } from 'ttag';
import { PLANS, PLAN_TYPES, CYCLE, DRIVE_APP_NAME, MAIL_APP_NAME, VPN_APP_NAME } from '@proton/shared/lib/constants';
import { Info } from '@proton/components';

import freePlanSvg from '@proton/styles/assets/img/vpn/plans/free.svg';
import basicPlanSvg from '@proton/styles/assets/img/vpn/plans/basic.svg';
import plusPlanSvg from '@proton/styles/assets/img/vpn/plans/plus.svg';
import visionaryPlanSvg from '@proton/styles/assets/img/vpn/plans/visionary.svg';
import { getBasicServers, getFreeServers, getPlusServers, getVpnConnections } from '@proton/shared/lib/vpn/features';

export const PLAN = {
    FREE: 'free',
    BUNDLE_PLUS: 'plus_vpnplus',
    VISIONARY: PLANS.VISIONARY,
    BASIC: PLANS.VPNBASIC,
    PLUS: PLANS.VPNPLUS,
};

export const PLAN_NAMES = {
    [PLAN.BUNDLE_PLUS]: 'Mail+VPN Plus',
    [PLAN.FREE]: 'Free',
    [PLAN.VISIONARY]: 'Visionary',
    [PLAN.BASIC]: 'Basic',
    [PLAN.PLUS]: 'Plus',
};

export const PLAN_BUNDLES = {
    [PLAN.BUNDLE_PLUS]: [PLANS.PLUS, PLANS.VPNPLUS],
};

export const VPN_PLANS = [PLAN.FREE, PLAN.BASIC, PLAN.PLUS, PLAN.VISIONARY];

const getPlanFeatures = (plan, maxConnections, countries, serversCount) => {
    const netflix = <b key={1}>{c('Netflix').t`Netflix`}</b>;
    const disney = <b key={2}>{c('Disney').t`Disney+`}</b>;
    const primeVideo = <b key={3}>{c('Prime Video').t`Prime Video`}</b>;
    const many = <b key={4}>{c('Many Others').t`and many others`}</b>;

    const mailVisionary = `${MAIL_APP_NAME} Visionary`;
    const mailPlus = `${MAIL_APP_NAME} Plus`;

    return {
        [PLAN.FREE]: {
            image: <img width={13} src={freePlanSvg} alt={`${PLAN_NAMES[PLAN.FREE]} plan`} />,
            description: c('Plan Description').t`Privacy and security for everyone`,
            upsell: {
                planName: PLAN.BASIC,
                features: [
                    getBasicServers(serversCount[PLANS.VPNBASIC], countries[PLANS.VPNBASIC].count),
                    c('Plan Feature').t`High speed`,
                    c('Plan Feature').t`Filesharing/P2P support`,
                ],
            },
            features: [
                getFreeServers(serversCount.free_vpn, countries.free_vpn.count),
                getVpnConnections(maxConnections),
                c('Plan Feature').t`Medium speed`,
                c('Plan Feature').t`Strict no-logs policy`,

                <>
                    <span className="mr0-5">{c('Plan feature').t`Access blocked content`}</span>
                    <Info
                        title={c('Info')
                            .t`Access blocked content, like social media, news, Wikipedia, YouTube, and many others, no matter where you are.`}
                    />
                </>,
            ],
        },
        [PLAN.BASIC]: {
            image: <img width={60} src={basicPlanSvg} alt={`${PLAN_NAMES[PLAN.BASIC]} plan`} />,
            description: c('Plan Description').t`Basic privacy features`,
            upsell: {
                planName: PLAN.PLUS,
                features: [
                    c('Plan Feature').t`Highest speed (up to 10 Gbps)`,
                    c('Plan Feature').t`Streaming service support`,
                    c('Plan Feature').t`All advanced security features`,
                ],
            },
            features: [
                getBasicServers(serversCount[PLANS.VPNBASIC], countries[PLANS.VPNBASIC].count),
                getVpnConnections(maxConnections),

                c('Plan Feature').t`High speed`,
                c('Plan Feature').t`Strict no-logs policy`,
                <>
                    <span className="mr0-5">{c('Plan feature').t`Access blocked content`}</span>
                    <Info
                        title={c('Info')
                            .t`Access blocked content, like social media, news, Wikipedia, YouTube, and many others, no matter where you are.`}
                    />
                </>,
                <>
                    <span className="mr0-5">{c('Plan feature').t`P2P/BitTorrent support`}</span>
                    <Info
                        title={c('Info').t`Support for file sharing protocols such as BitTorrent.`}
                        url="https://protonvpn.com/support/p2p-vpn-redirection/"
                    />
                </>,
                <>
                    <span className="mr0-5">{c('Plan feature').t`Adblocker (NetShield)`}</span>
                    <Info
                        title={c('Info')
                            .t`NetShield protects your device and speeds up your browsing by blocking ads, trackers, and malware.`}
                        url=" https://protonvpn.com/support/netshield/"
                    />
                </>,
            ],
        },
        [PLAN.PLUS]: {
            image: <img width={60} src={plusPlanSvg} alt={`${PLAN_NAMES[PLAN.PLUS]} plan`} />,
            isBest: true,
            description: c('Plan Description').t`Advanced security features`,
            features: [
                getPlusServers(serversCount[PLANS.VPNPLUS], countries[PLANS.VPNPLUS].count),
                getVpnConnections(maxConnections),
                c('Plan Feature').t`Highest speed (up to 10 Gbps)`,
                c('Plan Feature').t`Strict no-logs policy`,
                <>
                    <span className="mr0-5">{c('Plan feature').t`Access blocked content`}</span>
                    <Info
                        title={c('Info')
                            .t`Access blocked content, like social media, news, Wikipedia, YouTube, and many others, no matter where you are.`}
                    />
                </>,
                <>
                    <span className="mr0-5">{c('Plan feature').t`P2P/BitTorrent support`}</span>
                    <Info
                        title={c('Info').t`Support for file sharing protocols such as BitTorrent.`}
                        url="https://protonvpn.com/support/p2p-vpn-redirection/"
                    />
                </>,
                <>
                    <span className="mr0-5">{c('Plan feature').t`Adblocker (NetShield)`}</span>
                    <Info
                        title={c('Info')
                            .t`NetShield protects your device and speeds up your browsing by blocking ads, trackers, and malware.`}
                        url=" https://protonvpn.com/support/netshield/"
                    />
                </>,
                <>
                    <span className="mr0-5">{c('Plan feature').t`Streaming service support`}</span>
                    <Info
                        title={c('Info')
                            .jt`Access your streaming services, like ${netflix}, ${disney}, ${primeVideo}, ${many}, no matter where you are.`}
                        url="https://protonvpn.com/support/streaming-guide/"
                    />
                </>,
                <>
                    <span className="mr0-5">{c('Plan feature').t`Secure Core VPN`}</span>
                    <Info
                        title={c('Info')
                            .t`Defends against threats to VPN privacy by passing your Internet traffic through multiple servers.`}
                        url="https://protonvpn.com/support/secure-core-vpn/"
                    />
                </>,
                <>
                    <span className="mr0-5">{c('Plan feature').t`Tor over VPN`}</span>
                    <Info
                        title={c('Info').t`Route your Internet traffic through the Tor network with a single click.`}
                        url="https://protonvpn.com/support/tor-vpn/"
                    />
                </>,
            ],
        },
        [PLAN.VISIONARY]: {
            image: <img width={100} src={visionaryPlanSvg} alt={`${PLAN_NAMES[PLAN.VISIONARY]} plan`} />,
            description: c('Plan Description').t`The complete privacy suite`,
            features: [
                c('Plan feature').t`All ${PLAN_NAMES[PLAN.PLUS]} plan features`,
                <>
                    <span className="mr0-5">{c('Plan Feature').t`${mailVisionary} account`}</span>
                    <Info
                        title={c('Info')
                            .t`Get access to all the paid features for both ${VPN_APP_NAME} and ${MAIL_APP_NAME} (the encrypted email service that millions use to protect their data) with one plan.`}
                        url="https://protonmail.com"
                    />
                </>,
            ],
        },
        [PLAN.BUNDLE_PLUS]: {
            image: <img width={100} src={visionaryPlanSvg} alt={`${PLAN_NAMES[PLAN.VISIONARY]} plan`} />,
            description: c('Plan Description').t`Bundle plan`,
            features: [
                getPlusServers(serversCount[PLANS.VPNPLUS], countries[PLANS.VPNPLUS].count),
                getVpnConnections(maxConnections),
                c('Plan Feature').t`Highest speed (10 Gbps)`,
                c('Plan Feature').t`Strict no-logs policy`,
                <>
                    <span className="mr0-5">{c('Plan feature').t`P2P filesharing/BitTorrent support`}</span>
                    <Info
                        title={c('Info').t`Support for file sharing protocols such as BitTorrent.`}
                        url="https://protonvpn.com/support/p2p-vpn-redirection/"
                    />
                </>,
                <>
                    <span className="mr0-5">{c('Plan feature').t`Secure Core VPN`}</span>
                    <Info
                        title={c('Info')
                            .t`Defends against threats to VPN privacy by passing your Internet traffic through multiple servers.`}
                        url="https://protonvpn.com/support/secure-core-vpn/"
                    />
                </>,
                <>
                    <span className="mr0-5">{c('Plan feature').t`Tor over VPN`}</span>
                    <Info
                        title={c('Info').t`Route your Internet traffic through the Tor network with a single click.`}
                        url="https://protonvpn.com/support/tor-vpn/"
                    />
                </>,
                <>
                    <span className="mr0-5">{c('Plan feature').t`Access blocked content`}</span>
                    <Info
                        title={c('Info')
                            .t`Access blocked content, like social media, news, Wikipedia, YouTube, and many others, no matter where you are.`}
                    />
                </>,
                <>
                    <span className="mr0-5">{c('Plan feature').t`Streaming service support`}</span>
                    <Info
                        title={c('Info')
                            .jt`Access your streaming services, like ${netflix}, ${disney}, ${primeVideo}, ${many}, no matter where you are.`}
                        url="https://protonvpn.com/support/streaming-guide/"
                    />
                </>,
                <>
                    <span className="mr0-5">{c('Plan Feature').t`${mailPlus} account`}</span>
                    <Info
                        title={c('Info')
                            .t`Get access to all the paid features for both ${VPN_APP_NAME} and ${MAIL_APP_NAME} (the encrypted email service that millions use to protect their data) with one plan.`}
                        url="https://protonmail.com"
                    />
                </>,
                <>
                    <span className="mr0-5">{DRIVE_APP_NAME}</span>
                    <span className="text-success">{c('Price').t`FREE`}</span>
                </>,
            ],
        },
    }[plan];
};

// To use coupon, AmountDue from coupon must be merged into plan.
const getPlanPrice = (plan, cycle) => {
    const monthly = plan.Pricing[CYCLE.MONTHLY];
    const cyclePrice = plan.Pricing[cycle];
    const adjustedTotal = plan.AmountDue;

    const total = typeof adjustedTotal !== 'undefined' ? adjustedTotal : cyclePrice;
    const saved = monthly * cycle - cyclePrice;
    const totalMonthly = total / cycle;

    return { monthly, total, totalMonthly, saved };
};

export const getPlan = (planName, cycle, plans = [], countries = [], serversCount = {}) => {
    const plan = plans.find(({ Type, Name }) => Type === PLAN_TYPES.PLAN && Name === planName);
    const price = (plan && getPlanPrice(plan, cycle)) || { monthly: 0, total: 0, totalMonthly: 0, saved: 0 };

    return {
        ...getPlanFeatures(planName, plan ? plan.MaxVPN || 0 : 1, countries, serversCount),
        planName,
        title: PLAN_NAMES[planName],
        ID: plan && plan.ID,
        disabled: !plan && planName !== PLAN.FREE,
        price,
        couponDiscount:
            plan && typeof plan.AmountDue !== 'undefined' ? Math.abs(price.monthly * cycle - plan.AmountDue) : 0,
        couponDescription: plan && plan.CouponDescription,
    };
};
