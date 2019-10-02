import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { SmallButton, Price, Icon, Info, Tooltip, useToggle } from 'react-components';
import { getPlanName } from 'proton-shared/lib/helpers/subscription';
import { CYCLE, DEFAULT_CURRENCY, DEFAULT_CYCLE, PLANS } from 'proton-shared/lib/constants';

import CurrencySelector from './CurrencySelector';
import CycleSelector from './CycleSelector';

const { MONTHLY, YEARLY, TWO_YEARS } = CYCLE;
const { PLUS, PROFESSIONAL, VISIONARY } = PLANS;
const FREE = 'free';
const PLAN_NUMBERS = {
    [FREE]: 1,
    [PLUS]: 2,
    [PROFESSIONAL]: 3,
    [VISIONARY]: 4
};

const PlansTable = ({
    user = {},
    subscription = {},
    plans = [],
    currency = DEFAULT_CURRENCY,
    cycle = DEFAULT_CYCLE,
    updateCurrency,
    updateCycle,
    onSelect
}) => {
    const planName = getPlanName(subscription) || FREE;
    const { hasPaidVpn } = user;
    const { state, toggle } = useToggle();
    const mySubscription = c('Title').t`My subscription`;

    const getPrice = (planName) => {
        const plan = plans.find(({ Name }) => Name === planName);
        const monthlyPrice = (
            <Price className="h3 mb0" currency={currency} suffix={planName === 'professional' ? '/mo/user' : '/mo'}>
                {plan.Pricing[cycle] / cycle}
            </Price>
        );

        if (cycle === MONTHLY) {
            return monthlyPrice;
        }

        const billedPrice = (
            <Price key="planPrice" currency={currency} suffix={cycle === YEARLY ? '/year' : '/2-year'}>
                {plan.Pricing[cycle]}
            </Price>
        );

        return (
            <>
                <div>{monthlyPrice}</div>
                <small>{c('Info').jt`billed as ${billedPrice}`}</small>
            </>
        );
    };

    const addCycleTooltip = (comp) => {
        if (cycle === TWO_YEARS) {
            return comp;
        }

        return <Tooltip title={c('Tooltip').t`Save 20% when billed annually`}>{comp}</Tooltip>;
    };

    return (
        <table className="pm-plans-table pm-table--highlight noborder" data-plan-number={PLAN_NUMBERS[planName]}>
            <thead>
                <tr>
                    <th className="is-empty" />
                    <th scope="col" data-highlight={mySubscription} className="aligncenter">
                        FREE
                    </th>
                    <th scope="col" data-highlight={mySubscription} className="aligncenter">
                        PLUS
                    </th>
                    <th scope="col" data-highlight={mySubscription} className="aligncenter">
                        PROFESSIONAL
                    </th>
                    <th scope="col" data-highlight={mySubscription} className="aligncenter">
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
                    <td className="bg-global-light aligncenter">FREE</td>
                    <td className="bg-global-light aligncenter">{getPrice('plus')}</td>
                    <td className="bg-global-light aligncenter">{getPrice('professional')}</td>
                    <td className="bg-global-light aligncenter">{getPrice('visionary')}</td>
                </tr>
                <tr>
                    <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">{c('Header')
                        .t`Users`}</th>
                    <td className="aligncenter">1</td>
                    <td className="aligncenter">1</td>
                    <td className="aligncenter">1-5000*</td>
                    <td className="aligncenter">6</td>
                </tr>
                <tr>
                    <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">{c('Header')
                        .t`Email addresses`}</th>
                    <td className="aligncenter">1</td>
                    <td className="aligncenter">5*</td>
                    <td className="aligncenter">5 / {c('X / user').t`user`}</td>
                    <td className="aligncenter">25</td>
                </tr>
                <tr>
                    <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">{c('Header')
                        .t`Storage capacity (GB)`}</th>
                    <td className="aligncenter">0.5</td>
                    <td className="aligncenter">5*</td>
                    <td className="aligncenter">5 / {c('X / user').t`user`}</td>
                    <td className="aligncenter">30</td>
                </tr>
                <tr>
                    <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">
                        <span className="mr0-5">{c('Header').t`Messages per day`}</span>
                        <Info title={c('Tooltip').t`ProtonMail cannot be used for bulk sending or spamming`} />
                    </th>
                    <td className="aligncenter">150</td>
                    <td className="aligncenter">1000</td>
                    <td className="aligncenter">{c('Plan option').t`Unlimited`}</td>
                    <td className="aligncenter">{c('Plan option').t`Unlimited`}</td>
                </tr>
                {state ? (
                    <tr>
                        <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">{c('Header')
                            .t`Folders`}</th>
                        <td className="aligncenter">3</td>
                        <td className="aligncenter">200</td>
                        <td className="aligncenter">{c('Plan option').t`Unlimited`}</td>
                        <td className="aligncenter">{c('Plan option').t`Unlimited`}</td>
                    </tr>
                ) : null}
                {state ? (
                    <tr>
                        <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">{c('Header')
                            .t`Labels`}</th>
                        <td className="aligncenter">3</td>
                        <td className="aligncenter">200</td>
                        <td className="aligncenter">{c('Plan option').t`Unlimited`}</td>
                        <td className="aligncenter">{c('Plan option').t`Unlimited`}</td>
                    </tr>
                ) : null}
                <tr>
                    <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">
                        <span className="mr0-5">{c('Header').t`Custom domains`}</span>
                        <Info title={c('Tooltip').t`Use your own domain name`} />
                    </th>
                    <td className="aligncenter">
                        <Icon name="off" />
                    </td>
                    <td className="aligncenter">1*</td>
                    <td className="aligncenter">2*</td>
                    <td className="aligncenter">10</td>
                </tr>
                <tr>
                    <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">
                        <span className="mr0-5">{c('Header').t`IMAP / SMTP support`}</span>
                        <Info title={c('Tooltip').t`Use ProtonMail with a desktop email client`} />
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
                {state ? null : (
                    <tr>
                        <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">{c('Header')
                            .t`Additional features`}</th>
                        <td className="aligncenter">{c('Plan option').t`Only basic email features`}</td>
                        <td className="aligncenter">{c('Plan option')
                            .t`Folders, Labels, Filters, Encrypted contacts, Auto-responder and more`}</td>
                        <td className="aligncenter">{c('Plan option')
                            .t`All Plus features, and catch-all email, multi-user support and more`}</td>
                        <td className="aligncenter">{c('Plan option')
                            .t`All Professional features, limited to 6 users, includes ProtonVPN`}</td>
                    </tr>
                )}
                {state ? (
                    <tr>
                        <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">{c('Header')
                            .t`Encrypted contact details`}</th>
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
                ) : null}
                {state ? (
                    <tr>
                        <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">{c('Header')
                            .t`Short address (@pm.me)`}</th>
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
                ) : null}
                {state ? (
                    <tr>
                        <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">{c('Header')
                            .t`Auto-reply`}</th>
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
                ) : null}
                {state ? (
                    <tr>
                        <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">{c('Header')
                            .t`Catch-all email`}</th>
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
                        <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">{c('Header')
                            .t`Multi-user support`}</th>
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
                        <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">{c('Header')
                            .t`Priority customer support`}</th>
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
                <tr>
                    <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">
                        <span className="mr0-5">ProtonVPN</span>
                        <Info title={c('Tooltip').t`ProtonVPN keeps your Internet traffic private`} />
                    </th>
                    <td className="aligncenter">
                        <SmallButton className="pm-button--link" onClick={onSelect({ vpnplus: 1 })}>
                            {hasPaidVpn ? c('Action').t`Edit VPN` : c('Action').t`Add VPN`}
                        </SmallButton>
                    </td>
                    <td className="aligncenter">
                        <SmallButton className="pm-button--link" onClick={onSelect({ plus: 1, vpnplus: 1 })}>
                            {hasPaidVpn ? c('Action').t`Edit VPN` : c('Action').t`Add VPN`}
                        </SmallButton>
                    </td>
                    <td className="aligncenter">
                        <SmallButton className="pm-button--link" onClick={onSelect({ professional: 1, vpnplus: 1 })}>
                            {hasPaidVpn ? c('Action').t`Edit VPN` : c('Action').t`Add VPN`}
                        </SmallButton>
                    </td>
                    <td className="aligncenter">{c('Plan option').t`Included`}</td>
                </tr>
                <tr>
                    <th scope="row" className="pm-simple-table-row-th alignleft bg-global-light">
                        <SmallButton className="pm-button--link" onClick={toggle}>
                            {state ? c('Action').t`Hide additional features` : c('Action').t`Compare all features`}
                        </SmallButton>
                    </th>
                    <td className="aligncenter">
                        <SmallButton className="pm-button--primary" onClick={onSelect()}>{c('Action')
                            .t`Update`}</SmallButton>
                    </td>
                    <td className="aligncenter">
                        <SmallButton className="pm-button--primary" onClick={onSelect({ plus: 1, vpnplus: 1 })}>{c(
                            'Action'
                        ).t`Update`}</SmallButton>
                    </td>
                    <td className="aligncenter">
                        <SmallButton
                            className="pm-button--primary"
                            onClick={onSelect({ professional: 1, vpnplus: 1 })}
                        >{c('Action').t`Update`}</SmallButton>
                    </td>
                    <td className="aligncenter">
                        <SmallButton className="pm-button--primary" onClick={onSelect({ visionary: 1 })}>{c('Action')
                            .t`Update`}</SmallButton>
                    </td>
                </tr>
            </tbody>
        </table>
    );
};

PlansTable.propTypes = {
    subscription: PropTypes.object,
    currency: PropTypes.string,
    cycle: PropTypes.number,
    plans: PropTypes.array,
    user: PropTypes.object,
    updateCurrency: PropTypes.func,
    updateCycle: PropTypes.func,
    onSelect: PropTypes.func
};

export default PlansTable;
