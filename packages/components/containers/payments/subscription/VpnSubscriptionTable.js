import React from 'react';
import PropTypes from 'prop-types';
import { PLAN_NAMES, PLANS, CYCLE, CURRENCIES } from 'proton-shared/lib/constants';
import { toMap } from 'proton-shared/lib/helpers/object';
import { c } from 'ttag';
import freePlanSvg from 'design-system/assets/img/pv-images/plans/free-plan.svg';
import plusPlanSvg from 'design-system/assets/img/pv-images/plans/vpnbasic-plan.svg';
import professionalPlanSvg from 'design-system/assets/img/pv-images/plans/vpnplus-plan.svg';
import visionaryPlanSvg from 'design-system/assets/img/pv-images/plans/visionary-plan.svg';

import { LinkButton, Info } from '../../../components';
import { useVPNCountries, useModals } from '../../../hooks';

import SubscriptionTable from './SubscriptionTable';
import SubscriptionPrices from './SubscriptionPrices';
import SubscriptionFeaturesModal from './SubscriptionFeaturesModal';

const INDEXES = {
    [PLANS.VPNBASIC]: 1,
    [PLANS.VPNPLUS]: 2,
    [PLANS.VISIONARY]: 3,
};

const VpnSubscriptionTable = ({
    planNameSelected,
    plans: apiPlans = [],
    cycle,
    currency,
    onSelect,
    currentPlan,
    ...rest
}) => {
    const { createModal } = useModals();
    const plansMap = toMap(apiPlans, 'Name');
    const vpnBasicPlan = plansMap[PLANS.VPNBASIC];
    const vpnPlusPlan = plansMap[PLANS.VPNPLUS];
    const visionaryPlan = plansMap[PLANS.VISIONARY];
    const plusPlan = plansMap[PLANS.PLUS];
    const [vpnCountries] = useVPNCountries();
    const netflix = <b>{c('Netflix').t`Netflix`}</b>;
    const disney = <b>{c('Disney').t`Disney+`}</b>;
    const primeVideo = <b>{c('Prime Video').t`Prime Video`}</b>;
    const many = <b>{c('Many Others').t`and many others`}</b>;
    const plans = [
        {
            name: '',
            title: 'Free',
            canCustomize: false,
            price: <SubscriptionPrices cycle={cycle} currency={currency} />,
            imageSrc: freePlanSvg,
            description: c('Description').t`Privacy and security for everyone`,
            features: [
                { icon: 'arrow-right', content: c('Feature').t`1 VPN connection` },
                { icon: 'arrow-right', content: c('Feature').t`Servers in ${vpnCountries.free.length} countries` },
                { icon: 'arrow-right', content: c('Feature').t`Medium speed` },
                { icon: 'arrow-right', content: c('Feature').t`Strict no-logs policy` },
                {
                    icon: 'close',
                    content: (
                        <del className="mr0-5" key="filesharing">
                            <span className="opacity-50 mr0-5">
                                {c('Plan feature').t`P2P filesharing/BitTorrent support`}
                            </span>
                            <Info
                                title={c('Info').t`Support for file sharing protocols such as BitTorrent.`}
                                url="https://protonvpn.com/support/p2p-vpn-redirection/"
                            />
                        </del>
                    ),
                },
                {
                    icon: 'close',
                    content: (
                        <del className="mr0-5" key="secure">
                            <span className="opacity-50 mr0-5"> {c('Plan feature').t`Adblocker (NetShield)`}</span>
                            <Info
                                title={c('Info')
                                    .t`NetShield protects your device and speeds up your browsing by blocking ads, trackers, and malware.`}
                                url="https://protonvpn.com/support/netshield/"
                            />
                        </del>
                    ),
                },
                {
                    icon: 'close',
                    content: (
                        <del className="mr0-5" key="access">
                            <span className="opacity-50 mr0-5"> {c('Plan feature').t`Access blocked content`}</span>
                            <Info
                                title={c('Info')
                                    .t`Access blocked content, like social media, news, Wikipedia, YouTube, and many others, no matter where you are.`}
                                url="https://protonvpn.com/support/streaming-guide/"
                            />
                        </del>
                    ),
                },
                {
                    icon: 'close',
                    content: (
                        <del className="mr0-5" key="secure">
                            <span className="opacity-50 mr0-5"> {c('Plan feature').t`Secure Core VPN`}</span>
                            <Info
                                title={c('Info')
                                    .t`Defends against threats to VPN privacy by passing your Internet traffic through multiple servers.`}
                                url="https://protonvpn.com/support/secure-core-vpn/"
                            />
                        </del>
                    ),
                },
                {
                    icon: 'close',
                    content: (
                        <del className="mr0-5" key="advanced">
                            <span className="opacity-50 mr0-5"> {c('Plan feature').t`Tor over VPN`}</span>
                            <Info
                                title={c('Info')
                                    .t`Route your Internet traffic through the Tor network with a single click.`}
                                url="https://protonvpn.com/support/tor-vpn/"
                            />
                        </del>
                    ),
                },
                {
                    icon: 'close',
                    content: (
                        <del className="mr0-5" key="advanced">
                            <span className="opacity-50 mr0-5"> {c('Plan feature').t`Streaming service support`}</span>
                            <Info
                                title={c('Info')
                                    .jt`Access your streaming services, like ${netflix}, ${disney}, ${primeVideo}, ${many}, no matter where you are.`}
                                url="https://protonvpn.com/support/tor-vpn/"
                            />
                        </del>
                    ),
                },
            ],
        },
        vpnBasicPlan && {
            name: vpnBasicPlan.Name,
            planID: vpnBasicPlan.ID,
            title: PLAN_NAMES[PLANS.VPNBASIC],
            price: <SubscriptionPrices cycle={cycle} currency={currency} plan={vpnBasicPlan} />,
            imageSrc: plusPlanSvg,
            description: c('Description').t`Basic privacy features`,
            features: [
                { icon: 'arrow-right', content: c('Feature').t`2 VPN connections` },
                { icon: 'arrow-right', content: c('Feature').t`Servers in ${vpnCountries.basic.length} countries` },
                { icon: 'arrow-right', content: c('Feature').t`High speed` },
                { icon: 'arrow-right', content: c('Feature').t`Strict no-logs policy` },
                {
                    icon: 'arrow-right',
                    content: (
                        <span className="mr0-5">
                            <span className="mr0-5">{c('Plan feature').t`P2P filesharing/BitTorrent support`}</span>
                            <Info
                                title={c('Info').t`Support for file sharing protocols such as BitTorrent.`}
                                url="https://protonvpn.com/support/p2p-vpn-redirection/"
                            />
                        </span>
                    ),
                },
                {
                    icon: 'arrow-right',
                    content: (
                        <span className="mr0-5">
                            <span className="mr0-5">{c('Plan feature').t`Adblocker (NetShield)`}</span>
                            <Info
                                title={c('Info')
                                    .t`NetShield protects your device and speeds up your browsing by blocking ads, trackers, and malware.`}
                                url="https://protonvpn.com/support/netshield/"
                            />
                        </span>
                    ),
                },
                {
                    icon: 'arrow-right',
                    content: (
                        <span className="mr0-5" key="access">
                            <span className="mr0-5"> {c('Plan feature').t`Access blocked content`}</span>
                            <Info
                                title={c('Info')
                                    .t`Access blocked content, like social media, news, Wikipedia, YouTube, and many others, no matter where you are.`}
                                url="https://protonvpn.com/support/streaming-guide/"
                            />
                        </span>
                    ),
                },
                {
                    icon: 'close',
                    content: (
                        <del className="mr0-5" key="secure">
                            <span className="opacity-50 mr0-5"> {c('Plan feature').t`Secure Core VPN`}</span>
                            <Info
                                title={c('Info')
                                    .t`Defends against threats to VPN privacy by passing your Internet traffic through multiple servers.`}
                                url="https://protonvpn.com/support/secure-core-vpn/"
                            />
                        </del>
                    ),
                },
                {
                    icon: 'close',
                    content: (
                        <del className="mr0-5" key="advanced">
                            <span className="opacity-50 mr0-5"> {c('Plan feature').t`Tor over VPN`}</span>
                            <Info
                                title={c('Info')
                                    .t`Route your Internet traffic through the Tor network with a single click.`}
                                url="https://protonvpn.com/support/tor-vpn/"
                            />
                        </del>
                    ),
                },
                {
                    icon: 'close',
                    content: (
                        <del className="mr0-5" key="advanced">
                            <span className="opacity-50 mr0-5"> {c('Plan feature').t`Streaming service support`}</span>
                            <Info
                                title={c('Info')
                                    .jt`Access your streaming services, like ${netflix}, ${disney}, ${primeVideo}, ${many}, no matter where you are.`}
                                url="https://protonvpn.com/support/tor-vpn/"
                            />
                        </del>
                    ),
                },
            ],
        },
        vpnPlusPlan && {
            name: vpnPlusPlan.Name,
            planID: vpnPlusPlan.ID,
            title: PLAN_NAMES[PLANS.VPNPLUS],
            price: <SubscriptionPrices cycle={cycle} currency={currency} plan={vpnPlusPlan} />,
            imageSrc: professionalPlanSvg,
            description: c('Description').t`Advanced security features`,
            features: [
                { icon: 'arrow-right', content: c('Feature').t`5 VPN connections` },
                { icon: 'arrow-right', content: c('Feature').t`Servers in ${vpnCountries.all.length} countries` },
                { icon: 'arrow-right', content: c('Feature').t`Highest speed (up to 10 Gbps)` },
                { icon: 'arrow-right', content: c('Feature').t`Strict no-logs policy` },
                {
                    icon: 'arrow-right',
                    content: (
                        <span className="mr0-5">
                            <span className="mr0-5">{c('Plan feature').t`P2P filesharing/BitTorrent support`}</span>
                            <Info
                                title={c('Info').t`Support for file sharing protocols such as BitTorrent.`}
                                url="https://protonvpn.com/support/p2p-vpn-redirection/"
                            />
                        </span>
                    ),
                },
                {
                    icon: 'arrow-right',
                    content: (
                        <span className="mr0-5">
                            <span className="mr0-5">{c('Plan feature').t`Adblocker (NetShield)`}</span>
                            <Info
                                title={c('Info')
                                    .t`NetShield protects your device and speeds up your browsing by blocking ads, trackers, and malware.`}
                                url="https://protonvpn.com/support/netshield/"
                            />
                        </span>
                    ),
                },
                {
                    icon: 'arrow-right',
                    content: (
                        <span className="mr0-5" key="access">
                            <span className="mr0-5"> {c('Plan feature').t`Access blocked content`}</span>
                            <Info
                                title={c('Info')
                                    .t`Access blocked content, like social media, news, Wikipedia, YouTube, and many others, no matter where you are.`}
                                url="https://protonvpn.com/support/streaming-guide/"
                            />
                        </span>
                    ),
                },
                {
                    icon: 'arrow-right',
                    content: (
                        <span className="mr0-5">
                            <span className="mr0-5">{c('Plan feature').t`Secure Core VPN`}</span>
                            <Info
                                title={c('Info')
                                    .t`Defends against threats to VPN privacy by passing your Internet traffic through multiple servers.`}
                                url="https://protonvpn.com/support/secure-core-vpn/"
                            />
                        </span>
                    ),
                },
                {
                    icon: 'arrow-right',
                    content: (
                        <span className="mr0-5">
                            <span className="mr0-5">{c('Plan feature').t`Tor over VPN`}</span>
                            <Info
                                title={c('Info')
                                    .t`Route your Internet traffic through the Tor network with a single click.`}
                                url="https://protonvpn.com/support/tor-vpn/"
                            />
                        </span>
                    ),
                },
                {
                    icon: 'arrow-right',
                    content: (
                        <span className="mr0-5" key="advanced">
                            <span className="mr0-5"> {c('Plan feature').t`Streaming service support`}</span>
                            <Info
                                title={c('Info')
                                    .jt`Access your streaming services, like ${netflix}, ${disney}, ${primeVideo}, ${many}, no matter where you are.`}
                                url="https://protonvpn.com/support/tor-vpn/"
                            />
                        </span>
                    ),
                },
            ],
        },
        visionaryPlan && {
            name: visionaryPlan.Name,
            planID: visionaryPlan.ID,
            title: PLAN_NAMES[PLANS.VISIONARY],
            price: <SubscriptionPrices cycle={cycle} currency={currency} plan={visionaryPlan} />,
            imageSrc: visionaryPlanSvg,
            description: c('Description').t`The complete privacy suite`,
            features: [
                { icon: 'arrow-right', content: c('Feature').t`All Plus plan features` },
                { icon: 'arrow-right', content: c('Feature').t`10 simultaneous VPN connections` },
                {
                    icon: 'arrow-right',
                    content: (
                        <>
                            <span className="mr0-5">
                                <span className="mr0-5">{c('Plan Feature').t`ProtonMail Visionary account`}</span>
                                <Info
                                    title={c('Info')
                                        .t`Get access to all the paid features for both ProtonVPN and ProtonMail (the encrypted email service that millions use to protect their data) with one plan.`}
                                    url="https://protonmail.com"
                                />
                            </span>
                        </>
                    ),
                },
            ],
        },
    ];

    return (
        <div className="vpnSubscriptionTable-container">
            <SubscriptionTable
                currentPlanIndex={INDEXES[planNameSelected] || 0}
                mostPopularIndex={2}
                plans={plans}
                onSelect={(index, expanded) =>
                    onSelect(expanded && !index ? plusPlan.ID : plans[index].planID, expanded)
                }
                currentPlan={currentPlan}
                {...rest}
            />
            <div className="text-center pb1 on-mobile-pb2 subscriptionTable-show-features-container">
                <LinkButton
                    className="button--small"
                    onClick={() => createModal(<SubscriptionFeaturesModal currency={currency} cycle={cycle} />)}
                >
                    {c('Action').t`Show all features`}
                </LinkButton>
            </div>
        </div>
    );
};

VpnSubscriptionTable.propTypes = {
    currentPlan: PropTypes.string,
    planNameSelected: PropTypes.string,
    plans: PropTypes.arrayOf(PropTypes.object),
    onSelect: PropTypes.func.isRequired,
    cycle: PropTypes.oneOf([CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS]).isRequired,
    currency: PropTypes.oneOf(CURRENCIES).isRequired,
};

export default VpnSubscriptionTable;
