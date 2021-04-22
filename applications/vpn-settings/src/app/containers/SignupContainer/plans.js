import React from 'react';
import { c, msgid } from 'ttag';
import { PLANS, PLAN_TYPES, CYCLE } from 'proton-shared/lib/constants';
import { Info } from 'react-components';
import freePlanSvg from 'design-system/assets/img/pv-images/plans/free.svg';
import basicPlanSvg from 'design-system/assets/img/pv-images/plans/basic.svg';
import plusPlanSvg from 'design-system/assets/img/pv-images/plans/plus.svg';
import visionaryPlanSvg from 'design-system/assets/img/pv-images/plans/visionary.svg';

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
export const BEST_DEAL_PLANS = [PLAN.BASIC, PLAN.PLUS, PLAN.VISIONARY];

const getServersText = (n) => {
    return c('Plan Feature').ngettext(msgid`Server in ${n} country`, `Servers in ${n} countries`, n);
};

const getPlanFeatures = (plan, maxConnections, countries) => {
    const netflix = <b key={1}>{c('Netflix').t`Netflix`}</b>;
    const disney = <b key={2}>{c('Disney').t`Disney+`}</b>;
    const primeVideo = <b key={3}>{c('Prime Video').t`Prime Video`}</b>;
    const many = <b key={4}>{c('Many Others').t`and many others`}</b>;

    return {
        [PLAN.FREE]: {
            image: <img width={13} src={freePlanSvg} alt={`${PLAN_NAMES[PLAN.FREE]} plan`} />,
            description: c('Plan Description').t`Privacy and security for everyone`,
            upsell: {
                planName: PLAN.BASIC,
                features: [
                    c('Plan Feature').t`High speed 1 Gbps VPN servers`,
                    getServersText(countries[PLANS.VPNBASIC].count),
                    c('Plan Feature').t`Filesharing/P2P support`,
                ],
            },
            features: [
                c('Plan Feature').ngettext(
                    msgid`${maxConnections} VPN connection`,
                    `${maxConnections} VPN connections`,
                    maxConnections
                ),
                getServersText(countries.free_vpn.count),
                c('Plan Feature').t`Medium speed`,
                c('Plan Feature').t`Strict no-logs policy`,
                <>
                    <del className="color-weak mr0-5">{c('Plan feature').t`P2P filesharing/BitTorrent support`}</del>
                    <Info
                        title={c('Info').t`Support for file sharing protocols such as BitTorrent.`}
                        url="https://protonvpn.com/support/p2p-vpn-redirection/"
                    />
                </>,
                <>
                    <del className="color-weak mr0-5">{c('Plan feature').t`Access blocked content`}</del>
                    <Info
                        title={c('Info')
                            .t`Access blocked content, like social media, news, Wikipedia, YouTube, and many others, no matter where you are.`}
                    />
                </>,
                <>
                    <del className="color-weak mr0-5">{c('Plan feature').t`Adblocker (NetShield)`}</del>
                    <Info
                        title={c('Info')
                            .t`NetShield protects your device and speeds up your browsing by blocking ads, trackers, and malware.`}
                        url=" https://protonvpn.com/support/netshield/"
                    />
                </>,
                <>
                    <del className="color-weak mr0-5">{c('Plan feature').t`Secure Core VPN`}</del>
                    <Info
                        title={c('Info')
                            .t`Defends against threats to VPN privacy by passing your Internet traffic through multiple servers.`}
                        url="https://protonvpn.com/support/secure-core-vpn/"
                    />
                </>,
                <>
                    <del className="color-weak mr0-5">{c('Plan feature').t`Tor over VPN`}</del>
                    <Info
                        title={c('Info').t`Route your Internet traffic through the Tor network with a single click.`}
                        url="https://protonvpn.com/support/tor-vpn/"
                    />
                </>,
                <>
                    <del className="color-weak mr0-5">{c('Plan feature').t`Streaming service support`}</del>
                    <Info
                        title={c('Info')
                            .jt`Access your streaming services, like ${netflix}, ${disney}, ${primeVideo}, ${many}, no matter where you are.`}
                        url="https://protonvpn.com/support/streaming-guide/"
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
                    c('Plan Feature').t`Highest speed servers (10 Gbps)`,
                    c('Plan Feature').t`Access blocked content`,
                    c('Plan Feature').t`All advanced security features`,
                ],
            },
            features: [
                c('Plan Feature').ngettext(
                    msgid`${maxConnections} VPN connection`,
                    `${maxConnections} VPN connections`,
                    maxConnections
                ),
                getServersText(countries[PLANS.VPNBASIC].count),
                c('Plan Feature').t`High speed`,
                c('Plan Feature').t`Strict no-logs policy`,
                <>
                    <span className="mr0-5">{c('Plan feature').t`P2P filesharing/BitTorrent support`}</span>
                    <Info
                        title={c('Info').t`Support for file sharing protocols such as BitTorrent.`}
                        url="https://protonvpn.com/support/p2p-vpn-redirection/"
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
                    <del className="color-weak mr0-5">{c('Plan feature').t`Adblocker (NetShield)`}</del>
                    <Info
                        title={c('Info')
                            .t`NetShield protects your device and speeds up your browsing by blocking ads, trackers, and malware.`}
                        url=" https://protonvpn.com/support/netshield/"
                    />
                </>,
                <>
                    <del className="color-weak mr0-5">{c('Plan feature').t`Secure Core VPN`}</del>
                    <Info
                        title={c('Info')
                            .t`Defends against threats to VPN privacy by passing your Internet traffic through multiple servers.`}
                        url="https://protonvpn.com/support/secure-core-vpn/"
                    />
                </>,
                <>
                    <del className="color-weak mr0-5">{c('Plan feature').t`Tor over VPN`}</del>
                    <Info
                        title={c('Info').t`Route your Internet traffic through the Tor network with a single click.`}
                        url="https://protonvpn.com/support/tor-vpn/"
                    />
                </>,
                <>
                    <del className="color-weak mr0-5">{c('Plan feature').t`Streaming service support`}</del>
                    <Info
                        title={c('Info')
                            .jt`Access your streaming services, like ${netflix}, ${disney}, ${primeVideo}, ${many}, no matter where you are.`}
                        url="https://protonvpn.com/support/streaming-guide/"
                    />
                </>,
            ],
        },
        [PLAN.PLUS]: {
            image: <img width={60} src={plusPlanSvg} alt={`${PLAN_NAMES[PLAN.PLUS]} plan`} />,
            isBest: true,
            description: c('Plan Description').t`Advanced security features`,
            features: [
                c('Plan Feature').ngettext(
                    msgid`${maxConnections} VPN connection`,
                    `${maxConnections} VPN connections`,
                    maxConnections
                ),
                getServersText(countries[PLANS.VPNPLUS].count),
                c('Plan Feature').t`Highest speed (up to 10 Gbps)`,
                c('Plan Feature').t`Strict no-logs policy`,
                <>
                    <span className="mr0-5">{c('Plan feature').t`P2P filesharing/BitTorrent support`}</span>
                    <Info
                        title={c('Info').t`Support for file sharing protocols such as BitTorrent.`}
                        url="https://protonvpn.com/support/p2p-vpn-redirection/"
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
                    <span className="mr0-5">{c('Plan feature').t`Adblocker (NetShield)`}</span>
                    <Info
                        title={c('Info')
                            .t`NetShield protects your device and speeds up your browsing by blocking ads, trackers, and malware.`}
                        url=" https://protonvpn.com/support/netshield/"
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
                    <span className="mr0-5">{c('Plan feature').t`Streaming service support`}</span>
                    <Info
                        title={c('Info')
                            .jt`Access your streaming services, like ${netflix}, ${disney}, ${primeVideo}, ${many}, no matter where you are.`}
                        url="https://protonvpn.com/support/streaming-guide/"
                    />
                </>,
            ],
        },
        [PLAN.VISIONARY]: {
            image: <img width={100} src={visionaryPlanSvg} alt={`${PLAN_NAMES[PLAN.VISIONARY]} plan`} />,
            description: c('Plan Description').t`The complete privacy suite`,
            features: [
                c('Plan feature').t`All Plus plan features`,
                <>
                    <span className="mr0-5">{c('Plan Feature').t`ProtonMail Visionary account`}</span>
                    <Info
                        title={c('Info')
                            .t`Get access to all the paid features for both ProtonVPN and ProtonMail (the encrypted email service that millions use to protect their data) with one plan.`}
                        url="https://protonmail.com"
                    />
                </>,
            ],
        },
        [PLAN.BUNDLE_PLUS]: {
            image: <img width={100} src={visionaryPlanSvg} alt={`${PLAN_NAMES[PLAN.VISIONARY]} plan`} />,
            description: c('Plan Description').t`Bundle plan`,
            features: [
                c('Plan Feature').ngettext(
                    msgid`${maxConnections} VPN connection`,
                    `${maxConnections} VPN connections`,
                    maxConnections
                ),
                getServersText(countries[PLANS.VPNPLUS].count),
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
                    <span className="mr0-5">{c('Plan Feature').t`ProtonMail Plus account`}</span>
                    <Info
                        title={c('Info')
                            .t`Get access to all the paid features for both ProtonVPN and ProtonMail (the encrypted email service that millions use to protect their data) with one plan.`}
                        url="https://protonmail.com"
                    />
                </>,
                <>
                    <span className="mr0-5">ProtonDrive</span>
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

export const getPlan = (planName, cycle, plans = [], countries = []) => {
    const plan = plans.find(({ Type, Name }) => Type === PLAN_TYPES.PLAN && Name === planName);
    const price = (plan && getPlanPrice(plan, cycle)) || { monthly: 0, total: 0, totalMonthly: 0, saved: 0 };

    return {
        ...getPlanFeatures(planName, plan ? plan.MaxVPN || 0 : 1, countries),
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
