import React from 'react';
import PropTypes from 'prop-types';
import {
    Tooltip,
    Icon,
    CurrencySelector,
    CycleSelector,
    SmallButton,
    Info,
    Loader,
    useVPNCountries,
    useToggle
} from 'react-components';
import { c } from 'ttag';
import { PLANS, PLAN_SERVICES, DEFAULT_CURRENCY, DEFAULT_CYCLE, CYCLE } from 'proton-shared/lib/constants';
import { getPlanName } from 'proton-shared/lib/helpers/subscription';

import PlanPrice from './PlanPrice';

const { VISIONARY, VPNBASIC, VPNPLUS } = PLANS;
const FREE = 'free';
const PLAN_NUMBERS = {
    [FREE]: 1,
    [VPNBASIC]: 2,
    [VPNPLUS]: 3,
    [VISIONARY]: 4
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
    expand = false
}) => {
    const { state, toggle } = useToggle(expand);
    const mySubscriptionText = c('Title').t`My subscription`;
    const planName = getPlanName(subscription, PLAN_SERVICES.VPN) || FREE;
    const [countries, countriesLoading] = useVPNCountries();

    const getPlan = (planName) => plans.find(({ Name }) => Name === planName);

    const addCycleTooltip = (comp) => {
        if (cycle === CYCLE.MONTHLY) {
            return <Tooltip title={c('Tooltip').t`Save 20% when billed annually`}>{comp}</Tooltip>;
        }

        return comp;
    };

    return (
        <table className="pm-plans-table pm-table--highlight noborder" data-plan-number={PLAN_NUMBERS[planName]}>
            <thead>
                <tr>
                    <th className="is-empty" />
                    <th className="aligncenter" data-highlight={mySubscriptionText}>
                        FREE
                    </th>
                    <th className="aligncenter" data-highlight={mySubscriptionText}>
                        BASIC
                    </th>
                    <th className="aligncenter" data-highlight={mySubscriptionText}>
                        PLUS
                    </th>
                    <th className="aligncenter" data-highlight={mySubscriptionText}>
                        VISIONARY
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">
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
                    <td className="aligncenter bg-global-light">FREE</td>
                    <td className="aligncenter bg-global-light">
                        <PlanPrice cycle={cycle} currency={currency} plans={plans} planName={VPNBASIC} />
                    </td>
                    <td className="aligncenter bg-global-light">
                        <PlanPrice cycle={cycle} currency={currency} plans={plans} planName={VPNPLUS} />
                    </td>
                    <td className="aligncenter bg-global-light">
                        <PlanPrice cycle={cycle} currency={currency} plans={plans} planName={VISIONARY} />
                    </td>
                </tr>

                <tr>
                    <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">
                        <span className="mr0-5">{c('Header').t`Simultaneous connections`}</span>
                    </th>
                    <td className="aligncenter">1</td>
                    <td className="aligncenter">{getPlan(VPNBASIC).MaxVPN}</td>
                    <td className="aligncenter">{getPlan(VPNPLUS).MaxVPN}</td>
                    <td className="aligncenter">{getPlan(VISIONARY).MaxVPN}</td>
                </tr>

                <tr>
                    <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">
                        <span className="mr0-5">{c('Header').t`Countries`}</span>
                    </th>
                    <td className="aligncenter">{countriesLoading ? <Loader /> : countries.free.length}</td>
                    <td className="aligncenter">{countriesLoading ? <Loader /> : countries.basic.length}</td>
                    <td className="aligncenter">{countriesLoading ? <Loader /> : countries.all.length}</td>
                    <td className="aligncenter">{countriesLoading ? <Loader /> : countries.all.length}</td>
                </tr>

                <tr>
                    <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">{c('Header')
                        .t`Speed`}</th>
                    <td className="aligncenter">{c('Plan details').t`Medium`}</td>
                    <td className="aligncenter">{c('Plan details').t`High`}</td>
                    <td className="aligncenter">{c('Plan details').t`Highest`}</td>
                    <td className="aligncenter">{c('Plan details').t`Highest`}</td>
                </tr>

                <tr>
                    <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">
                        <span className="mr0-5">{c('Header').t`P2P support (BitTorrent, etc.)`}</span>
                    </th>
                    <td className="aligncenter">
                        <Icon name="off" />
                    </td>
                    <td className="aligncenter">
                        <Icon name="on" />
                    </td>
                    <td className="aligncenter">
                        <Icon name="on" />
                    </td>
                    <td className="aligncenter">
                        <Icon name="on" />
                    </td>
                </tr>

                <tr>
                    <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">
                        <span className="mr0-5">{c('Header').t`Tor over VPN`}</span>
                    </th>
                    <td className="aligncenter">
                        <Icon name="off" />
                    </td>
                    <td className="aligncenter">
                        <Icon name="off" />
                    </td>
                    <td className="aligncenter">
                        <Icon name="on" />
                    </td>
                    <td className="aligncenter">
                        <Icon name="on" />
                    </td>
                </tr>

                <tr>
                    <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">
                        <span className="mr0-5">{c('Header').t`Secure core`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`Provides additional protection against VPN server compromise by routing connections through our Secure Core network`}
                        />
                    </th>
                    <td className="aligncenter">
                        <Icon name="off" />
                    </td>
                    <td className="aligncenter">
                        <Icon name="off" />
                    </td>
                    <td className="aligncenter">
                        <Icon name="on" />
                    </td>
                    <td className="aligncenter">
                        <Icon name="on" />
                    </td>
                </tr>

                {state ? (
                    <tr>
                        <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">
                            <span className="mr0-5">{c('Header').t`Apps for Android / Linux / iOS / Windows`}</span>
                        </th>
                        <td className="aligncenter">
                            <Icon name="on" />
                        </td>
                        <td className="aligncenter">
                            <Icon name="on" />
                        </td>
                        <td className="aligncenter">
                            <Icon name="on" />
                        </td>
                        <td className="aligncenter">
                            <Icon name="on" />
                        </td>
                    </tr>
                ) : null}

                {state ? (
                    <tr>
                        <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">
                            <span className="mr0-5">{c('Header').t`Advanced encryption`}</span>
                        </th>
                        <td className="aligncenter">
                            <Icon name="on" />
                        </td>
                        <td className="aligncenter">
                            <Icon name="on" />
                        </td>
                        <td className="aligncenter">
                            <Icon name="on" />
                        </td>
                        <td className="aligncenter">
                            <Icon name="on" />
                        </td>
                    </tr>
                ) : null}

                {state ? (
                    <tr>
                        <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">
                            <span className="mr0-5">{c('Header').t`Kill Switch / Always-on`}</span>
                        </th>
                        <td className="aligncenter">
                            <Icon name="on" />
                        </td>
                        <td className="aligncenter">
                            <Icon name="on" />
                        </td>
                        <td className="aligncenter">
                            <Icon name="on" />
                        </td>
                        <td className="aligncenter">
                            <Icon name="on" />
                        </td>
                    </tr>
                ) : null}

                {state ? (
                    <tr>
                        <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">
                            <span className="mr0-5">{c('Header').t`No logs policy`}</span>
                        </th>
                        <td className="aligncenter">
                            <Icon name="on" />
                        </td>
                        <td className="aligncenter">
                            <Icon name="on" />
                        </td>
                        <td className="aligncenter">
                            <Icon name="on" />
                        </td>
                        <td className="aligncenter">
                            <Icon name="on" />
                        </td>
                    </tr>
                ) : null}

                {state ? (
                    <tr>
                        <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">
                            <span className="mr0-5">{c('Header').t`No data limits`}</span>
                        </th>
                        <td className="aligncenter">
                            <Icon name="on" />
                        </td>
                        <td className="aligncenter">
                            <Icon name="on" />
                        </td>
                        <td className="aligncenter">
                            <Icon name="on" />
                        </td>
                        <td className="aligncenter">
                            <Icon name="on" />
                        </td>
                    </tr>
                ) : null}

                {state ? (
                    <tr>
                        <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">
                            <span className="mr0-5">{c('Header').t`Stream geo-blocked content`}</span>
                        </th>
                        <td className="aligncenter">
                            <Icon name="off" />
                        </td>
                        <td className="aligncenter">
                            <Icon name="off" />
                        </td>
                        <td className="aligncenter">
                            <Icon name="on" />
                        </td>
                        <td className="aligncenter">
                            <Icon name="on" />
                        </td>
                    </tr>
                ) : null}

                {state ? (
                    <tr>
                        <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">
                            <span className="mr0-5">ProtonMail Visionary</span>
                            <Info title={c('Tooltip').t`Includes ProtonMail encrypted email with all features`} />
                        </th>
                        <td className="aligncenter">
                            <Icon name="off" />
                        </td>
                        <td className="aligncenter">
                            <Icon name="off" />
                        </td>
                        <td className="aligncenter">
                            <Icon name="off" />
                        </td>
                        <td className="aligncenter">
                            <Icon name="on" />
                        </td>
                    </tr>
                ) : null}

                {state ? (
                    <tr>
                        <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">
                            <span className="mr0-5">{c('Header').t`30-day money-back guarantee`}</span>
                        </th>
                        <td className="aligncenter" />
                        <td className="aligncenter">
                            <Icon name="on" />
                        </td>
                        <td className="aligncenter">
                            <Icon name="on" />
                        </td>
                        <td className="aligncenter">
                            <Icon name="on" />
                        </td>
                    </tr>
                ) : null}

                {onSelect && (
                    <tr>
                        <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">
                            <SmallButton className="pm-button--link" onClick={toggle}>
                                {state ? c('Action').t`Hide additional features` : c('Action').t`Compare all features`}
                            </SmallButton>
                        </th>
                        <td className="aligncenter">
                            <SmallButton disabled={loading} className="pm-button--primary" onClick={onSelect()}>
                                {planName === 'free' ? c('Action').t`Update` : c('Action').t`Select`}
                            </SmallButton>
                        </td>
                        <td className="aligncenter">
                            <SmallButton disabled={loading} className="pm-button--primary" onClick={onSelect(VPNBASIC)}>
                                {planName === VPNBASIC ? c('Action').t`Update` : c('Action').t`Select`}
                            </SmallButton>
                        </td>
                        <td className="aligncenter">
                            <SmallButton disabled={loading} className="pm-button--primary" onClick={onSelect(VPNPLUS)}>
                                {planName === VPNPLUS ? c('Action').t`Update` : c('Action').t`Select`}
                            </SmallButton>
                        </td>
                        <td className="aligncenter">
                            <SmallButton
                                disabled={loading}
                                className="pm-button--primary"
                                onClick={onSelect(VISIONARY)}
                            >
                                {planName === VISIONARY ? c('Action').t`Update` : c('Action').t`Select`}
                            </SmallButton>
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
    subscription: PropTypes.object
};

export default PlansTable;
