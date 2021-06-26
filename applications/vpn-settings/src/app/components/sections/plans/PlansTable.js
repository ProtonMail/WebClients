import React from 'react';
import PropTypes from 'prop-types';
import {
    Tooltip,
    Icon,
    CurrencySelector,
    CycleSelector,
    Button,
    Info,
    Loader,
    useVPNCountriesCount,
    useToggle,
} from 'react-components';
import { c } from 'ttag';
import { PLANS, PLAN_SERVICES, DEFAULT_CURRENCY, DEFAULT_CYCLE, CYCLE } from 'proton-shared/lib/constants';
import { getPlanName } from 'proton-shared/lib/helpers/subscription';

import PlanPrice from './PlanPrice';

import './PlansTable.scss';

const { VISIONARY, VPNBASIC, VPNPLUS } = PLANS;
const FREE = 'free';
const PLAN_NUMBERS = {
    [FREE]: 1,
    [VPNBASIC]: 2,
    [VPNPLUS]: 3,
    [VISIONARY]: 4,
};

const PlansTable = ({
    plans = [],
    loading,
    onSelect,
    cycle = DEFAULT_CYCLE,
    updateCycle,
    currency = DEFAULT_CURRENCY,
    updateCurrency,
    subscription = {},
    expand = false,
}) => {
    const { state, toggle } = useToggle(expand);
    const mySubscriptionText = c('Title').t`My subscription`;
    const planName = getPlanName(subscription, PLAN_SERVICES.VPN) || FREE;
    const [countries, countriesLoading] = useVPNCountriesCount();

    const getPlan = (planName) => plans.find(({ Name }) => Name === planName);

    const addCycleTooltip = (comp) => {
        if (cycle === CYCLE.MONTHLY) {
            return (
                <Tooltip title={c('Tooltip').t`Save 20% when billed annually`}>
                    <span>{comp}</span>
                </Tooltip>
            );
        }

        return comp;
    };

    return (
        <table
            className="pm-plans-table pm-table--highlight no-border w100 min-w35e pt3"
            data-plan-number={PLAN_NUMBERS[planName]}
        >
            <thead>
                <tr>
                    <th className="is-empty" />
                    <th className="text-center" data-highlight={mySubscriptionText}>
                        FREE
                    </th>
                    <th className="text-center" data-highlight={mySubscriptionText}>
                        BASIC
                    </th>
                    <th className="text-center" data-highlight={mySubscriptionText}>
                        PLUS
                    </th>
                    <th className="text-center" data-highlight={mySubscriptionText}>
                        VISIONARY
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <th scope="row" className="simple-table-row-th text-left bg-weak">
                        {addCycleTooltip(
                            <div className="flex flex-column">
                                <div className="mb0-5">
                                    <CurrencySelector currency={currency} onSelect={updateCurrency} />
                                </div>
                                <div>
                                    <CycleSelector cycle={cycle} onSelect={updateCycle} subscription={subscription} />
                                </div>
                            </div>
                        )}
                    </th>
                    <td className="text-center bg-weak">FREE</td>
                    <td className="text-center bg-weak">
                        <PlanPrice cycle={cycle} currency={currency} plans={plans} planName={VPNBASIC} />
                    </td>
                    <td className="text-center bg-weak">
                        <PlanPrice cycle={cycle} currency={currency} plans={plans} planName={VPNPLUS} />
                    </td>
                    <td className="text-center bg-weak">
                        <PlanPrice cycle={cycle} currency={currency} plans={plans} planName={VISIONARY} />
                    </td>
                </tr>

                <tr>
                    <th scope="row" className="simple-table-row-th text-left bg-weak">
                        <span className="mr0-5">{c('Header').t`Simultaneous connections`}</span>
                    </th>
                    <td className="text-center">1</td>
                    <td className="text-center">{getPlan(VPNBASIC).MaxVPN}</td>
                    <td className="text-center">{getPlan(VPNPLUS).MaxVPN}</td>
                    <td className="text-center">{getPlan(VISIONARY).MaxVPN}</td>
                </tr>

                <tr>
                    <th scope="row" className="simple-table-row-th text-left bg-weak">
                        <span className="mr0-5">{c('Header').t`Countries`}</span>
                    </th>
                    <td className="text-center">{countriesLoading ? <Loader /> : countries.free_vpn.count}</td>
                    <td className="text-center">{countriesLoading ? <Loader /> : countries[VPNBASIC].count}</td>
                    <td className="text-center">{countriesLoading ? <Loader /> : countries[VPNPLUS].count}</td>
                    <td className="text-center">{countriesLoading ? <Loader /> : countries[VPNPLUS].count}</td>
                </tr>

                <tr>
                    <th scope="row" className="simple-table-row-th text-left bg-weak">{c('Header').t`Speed`}</th>
                    <td className="text-center">{c('Plan details').t`Medium`}</td>
                    <td className="text-center">{c('Plan details').t`High`}</td>
                    <td className="text-center">{c('Plan details').t`Highest speed (up to 10 Gbps)`}</td>
                    <td className="text-center">{c('Plan details').t`Highest speed (10 Gbps)`}</td>
                </tr>

                <tr>
                    <th scope="row" className="simple-table-row-th text-left bg-weak text-cut">
                        <span className="mr0-5">{c('Header').t`P2P filesharing/BitTorrent support`}</span>
                        <Info
                            title={c('Info').t`Support for file sharing protocols such as BitTorrent.`}
                            url="https://protonvpn.com/support/p2p-vpn-redirection/"
                        />
                    </th>
                    <td className="text-center">
                        <Icon name="off" />
                    </td>
                    <td className="text-center">
                        <Icon name="on" />
                    </td>
                    <td className="text-center">
                        <Icon name="on" />
                    </td>
                    <td className="text-center">
                        <Icon name="on" />
                    </td>
                </tr>

                <tr>
                    <th scope="row" className="simple-table-row-th text-left bg-weak">
                        <span className="mr0-5">{c('Header').t`Tor over VPN`}</span>
                        <Info
                            title={c('Info')
                                .t`Route your Internet traffic through the Tor network with a single click.`}
                            url="https://protonvpn.com/support/tor-vpn/"
                        />
                    </th>
                    <td className="text-center">
                        <Icon name="off" />
                    </td>
                    <td className="text-center">
                        <Icon name="off" />
                    </td>
                    <td className="text-center">
                        <Icon name="on" />
                    </td>
                    <td className="text-center">
                        <Icon name="on" />
                    </td>
                </tr>

                <tr>
                    <th scope="row" className="simple-table-row-th text-left bg-weak">
                        <span className="mr0-5">{c('Header').t`Secure Core VPN`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`Provides additional protection against VPN server compromise by routing connections through our Secure Core network`}
                        />
                    </th>
                    <td className="text-center">
                        <Icon name="off" />
                    </td>
                    <td className="text-center">
                        <Icon name="off" />
                    </td>
                    <td className="text-center">
                        <Icon name="on" />
                    </td>
                    <td className="text-center">
                        <Icon name="on" />
                    </td>
                </tr>

                {state ? (
                    <tr>
                        <th scope="row" className="simple-table-row-th text-left bg-weak">
                            <span className="mr0-5">{c('Header').t`Apps for Android / Linux / iOS / Windows`}</span>
                        </th>
                        <td className="text-center">
                            <Icon name="on" />
                        </td>
                        <td className="text-center">
                            <Icon name="on" />
                        </td>
                        <td className="text-center">
                            <Icon name="on" />
                        </td>
                        <td className="text-center">
                            <Icon name="on" />
                        </td>
                    </tr>
                ) : null}

                {state ? (
                    <tr>
                        <th scope="row" className="simple-table-row-th text-left bg-weak">
                            <span className="mr0-5">{c('Header').t`Advanced encryption`}</span>
                        </th>
                        <td className="text-center">
                            <Icon name="on" />
                        </td>
                        <td className="text-center">
                            <Icon name="on" />
                        </td>
                        <td className="text-center">
                            <Icon name="on" />
                        </td>
                        <td className="text-center">
                            <Icon name="on" />
                        </td>
                    </tr>
                ) : null}

                {state ? (
                    <tr>
                        <th scope="row" className="simple-table-row-th text-left bg-weak">
                            <span className="mr0-5">{c('Header').t`Kill Switch / Always-on`}</span>
                        </th>
                        <td className="text-center">
                            <Icon name="on" />
                        </td>
                        <td className="text-center">
                            <Icon name="on" />
                        </td>
                        <td className="text-center">
                            <Icon name="on" />
                        </td>
                        <td className="text-center">
                            <Icon name="on" />
                        </td>
                    </tr>
                ) : null}

                {state ? (
                    <tr>
                        <th scope="row" className="simple-table-row-th text-left bg-weak">
                            <span className="mr0-5">{c('Header').t`No logs policy`}</span>
                        </th>
                        <td className="text-center">
                            <Icon name="on" />
                        </td>
                        <td className="text-center">
                            <Icon name="on" />
                        </td>
                        <td className="text-center">
                            <Icon name="on" />
                        </td>
                        <td className="text-center">
                            <Icon name="on" />
                        </td>
                    </tr>
                ) : null}

                {state ? (
                    <tr>
                        <th scope="row" className="simple-table-row-th text-left bg-weak">
                            <span className="mr0-5">{c('Header').t`No data limits`}</span>
                        </th>
                        <td className="text-center">
                            <Icon name="on" />
                        </td>
                        <td className="text-center">
                            <Icon name="on" />
                        </td>
                        <td className="text-center">
                            <Icon name="on" />
                        </td>
                        <td className="text-center">
                            <Icon name="on" />
                        </td>
                    </tr>
                ) : null}

                {state ? (
                    <tr>
                        <th scope="row" className="simple-table-row-th text-left bg-weak">
                            <span className="mr0-5">{c('Header').t`Access blocked content`}</span>
                            <Info
                                title={c('Info')
                                    .t`Access blocked content, like social media, news, Wikipedia, YouTube, and many others, no matter where you are.`}
                                url="https://protonvpn.com/support/streaming-guide/"
                            />
                        </th>
                        <td className="text-center">
                            <Icon name="off" />
                        </td>
                        <td className="text-center">
                            <Icon name="on" />
                        </td>
                        <td className="text-center">
                            <Icon name="on" />
                        </td>
                        <td className="text-center">
                            <Icon name="on" />
                        </td>
                    </tr>
                ) : null}

                {state ? (
                    <tr>
                        <th scope="row" className="simple-table-row-th text-left bg-weak">
                            <span className="mr0-5">ProtonMail Visionary</span>
                            <Info title={c('Tooltip').t`Includes ProtonMail encrypted email with all features`} />
                        </th>
                        <td className="text-center">
                            <Icon name="off" />
                        </td>
                        <td className="text-center">
                            <Icon name="off" />
                        </td>
                        <td className="text-center">
                            <Icon name="off" />
                        </td>
                        <td className="text-center">
                            <Icon name="on" />
                        </td>
                    </tr>
                ) : null}

                {state ? (
                    <tr>
                        <th scope="row" className="simple-table-row-th text-left bg-weak">
                            <span className="mr0-5">{c('Header').t`30-day money-back guarantee`}</span>
                        </th>
                        <td className="text-center" />
                        <td className="text-center">
                            <Icon name="on" />
                        </td>
                        <td className="text-center">
                            <Icon name="on" />
                        </td>
                        <td className="text-center">
                            <Icon name="on" />
                        </td>
                    </tr>
                ) : null}

                {state ? (
                    <tr>
                        <th scope="row" className="simple-table-row-th text-left bg-weak">
                            <span className="mr0-5">{c('Header').t`Streaming service support`}</span>
                        </th>
                        <td className="text-center">
                            <Icon name="off" />
                        </td>
                        <td className="text-center">
                            <Icon name="off" />
                        </td>
                        <td className="text-center">
                            <Icon name="on" />
                        </td>
                        <td className="text-center">
                            <Icon name="on" />
                        </td>
                    </tr>
                ) : null}

                {onSelect && (
                    <tr>
                        <th scope="row" className="simple-table-row-th text-left bg-weak">
                            <Button size="small" shape="link" color="norm" onClick={toggle}>
                                {state ? c('Action').t`Hide additional features` : c('Action').t`Compare all features`}
                            </Button>
                        </th>
                        <td className="text-center">
                            <Button size="small" disabled={loading} color="norm" onClick={onSelect()}>
                                {planName === 'free' ? c('Action').t`Update` : c('Action').t`Select`}
                            </Button>
                        </td>
                        <td className="text-center">
                            <Button size="small" disabled={loading} color="norm" onClick={onSelect(VPNBASIC)}>
                                {planName === VPNBASIC ? c('Action').t`Update` : c('Action').t`Select`}
                            </Button>
                        </td>
                        <td className="text-center">
                            <Button size="small" disabled={loading} color="norm" onClick={onSelect(VPNPLUS)}>
                                {planName === VPNPLUS ? c('Action').t`Update` : c('Action').t`Select`}
                            </Button>
                        </td>
                        <td className="text-center">
                            <Button size="small" disabled={loading} color="norm" onClick={onSelect(VISIONARY)}>
                                {planName === VISIONARY ? c('Action').t`Update` : c('Action').t`Select`}
                            </Button>
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
};

PlansTable.propTypes = {
    loading: PropTypes.bool,
    expand: PropTypes.bool,
    plans: PropTypes.array,
    onSelect: PropTypes.func,
    currency: PropTypes.string,
    cycle: PropTypes.number,
    updateCurrency: PropTypes.func,
    updateCycle: PropTypes.func,
    subscription: PropTypes.object,
};

export default PlansTable;
