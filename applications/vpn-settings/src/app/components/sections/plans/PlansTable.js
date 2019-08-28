import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip, Icon, CurrencySelector, CycleSelector, SmallButton, Info } from 'react-components';
import { c } from 'ttag';
import { PLANS, DEFAULT_CURRENCY, DEFAULT_CYCLE, PLAN_TYPES, PLAN_SERVICES } from 'proton-shared/lib/constants';

import PlanPrice from './PlanPrice';

const { VISIONARY, VPNBASIC, VPNPLUS } = PLANS;
const { PLAN } = PLAN_TYPES;
const { VPN } = PLAN_SERVICES;

const PLAN_NUMBERS = {
    free: 1,
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
    subscription
}) => {
    const mySuscriptionText = c('Title').t`My subscription`;
    const { Plans = [] } = subscription || {};
    const { Name = 'free' } = Plans.find(({ Services, Type }) => Type === PLAN && Services & VPN) || {};

    return (
        <table className="pm-plans-table pm-table--highlight noborder" data-plan-number={PLAN_NUMBERS[Name]}>
            <thead>
                <tr>
                    <th className="is-empty" />
                    <th className="aligncenter" data-highlight={mySuscriptionText}>
                        FREE
                    </th>
                    <th className="aligncenter" data-highlight={mySuscriptionText}>
                        BASIC
                    </th>
                    <th className="aligncenter" data-highlight={mySuscriptionText}>
                        PLUS
                    </th>
                    <th className="aligncenter" data-highlight={mySuscriptionText}>
                        VISIONARY
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">
                        <Tooltip title={c('Tooltip').t`Save 20% when billed annually`}>
                            <div className="flex flex-column">
                                <div className="mb0-5">
                                    <CurrencySelector currency={currency} onSelect={updateCurrency} />
                                </div>
                                <div>
                                    <CycleSelector cycle={cycle} onSelect={updateCycle} />
                                </div>
                            </div>
                        </Tooltip>
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
                        <span className="mr0-5">{c('Header').t`Countries`}</span>
                        <Info title={c('Tooltip').t`Access to VPN servers`} />
                    </th>
                    <td className="aligncenter">3</td>
                    <td className="aligncenter">{c('Plan details').t`All Countries`}</td>
                    <td className="aligncenter">{c('Plan details').t`All Countries`}</td>
                    <td className="aligncenter">{c('Plan details').t`All Countries`}</td>
                </tr>
                <tr>
                    <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">
                        <span className="mr0-5">{c('Header').t`Devices`}</span>
                        <Info title={c('Tooltip').t`Number of simultaneous connections`} />
                    </th>
                    <td className="aligncenter">1</td>
                    <td className="aligncenter">2</td>
                    <td className="aligncenter">5</td>
                    <td className="aligncenter">10</td>
                </tr>
                <tr>
                    <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">{c('Header')
                        .t`Speed`}</th>
                    <td className="aligncenter">{c('Plan details').t`Low`}</td>
                    <td className="aligncenter">{c('Plan details').t`High`}</td>
                    <td className="aligncenter">{c('Plan details').t`Highest`}</td>
                    <td className="aligncenter">{c('Plan details').t`Highest`}</td>
                </tr>
                <tr>
                    <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">
                        <span className="mr0-5">{c('Header').t`Plus servers`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`Exclusive servers only available to Plus and Visionary users with higher speed`}
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
                <tr>
                    <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">
                        <span className="mr0-5">{c('Header').t`Tor servers`}</span>
                        <Info
                            title={c('Tooltip').t`Send all your traffic through the Tor network with a single click`}
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
                <tr>
                    <th scope="row" className="pm-simple-table-row-th alignleft" />
                    <td className="aligncenter">
                        <SmallButton
                            disabled={loading}
                            className="pm-button--primary"
                            onClick={onSelect()}
                        >{c('Action').t`Update`}</SmallButton>
                    </td>
                    <td className="aligncenter">
                        <SmallButton
                            disabled={loading}
                            className="pm-button--primary"
                            onClick={onSelect(VPNBASIC)}
                        >{c('Action').t`Update`}</SmallButton>
                    </td>
                    <td className="aligncenter">
                        <SmallButton
                            disabled={loading}
                            className="pm-button--primary"
                            onClick={onSelect(VPNPLUS)}
                        >{c('Action').t`Update`}</SmallButton>
                    </td>
                    <td className="aligncenter">
                        <SmallButton
                            disabled={loading}
                            className="pm-button--primary"
                            onClick={onSelect(VISIONARY)}
                        >{c('Action').t`Update`}</SmallButton>
                    </td>
                </tr>
            </tbody>
        </table>
    );
};

PlansTable.propTypes = {
    loading: PropTypes.bool,
    plans: PropTypes.array,
    onSelect: PropTypes.func,
    currency: PropTypes.string,
    cycle: PropTypes.number,
    updateCurrency: PropTypes.func,
    updateCycle: PropTypes.func,
    subscription: PropTypes.object
};

export default PlansTable;
