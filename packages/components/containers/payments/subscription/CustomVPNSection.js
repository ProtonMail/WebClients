import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Price, Icon, Info, Checkbox, Select, useToggle, SmallButton } from 'react-components';
import { c } from 'ttag';
import { range } from 'proton-shared/lib/helpers/array';
import { omit } from 'proton-shared/lib/helpers/object';
import { PLAN_SERVICES } from 'proton-shared/lib/constants';

import PlanPrice from './PlanPrice';
import { getTextOption, getPlan, getAddon, getSubTotal } from './helpers';
import CyclePromotion from './CyclePromotion';
import CycleDiscountBadge from '../CycleDiscountBadge';

const { VPN } = PLAN_SERVICES;

const vpnOptions = range(5, 501).map((value, index) => ({
    text: getTextOption('vpn', value, index),
    value: index
}));

const CustomVPNSection = ({ plans, model, onChange }) => {
    const vpnBasicPlan = getPlan(plans, { name: 'vpnbasic' });
    const vpnPlusPlan = getPlan(plans, { name: 'vpnplus' });
    const vpnAddon = getAddon(plans, { name: '1vpn' });
    const { state, toggle } = useToggle();
    const subTotal = getSubTotal({ ...model, plans, services: VPN });

    const handleCheckboxChange = (key) => ({ target }) => {
        const toOmit = ['vpnbasic', 'vpnplus'];

        if (key !== 'plus' || !target.checked) {
            toOmit.push('vpn');
        }

        const plansMap = omit(model.plansMap, toOmit);

        if (target.checked) {
            plansMap[key] = 1;
        }

        onChange({ ...model, plansMap });
    };

    const handleSelectChange = ({ target }) => {
        onChange({ ...model, plansMap: { ...model.plansMap, ['1vpn']: +target.value } });
    };

    return (
        <>
            <Alert>{c('Info')
                .t`By using ProtonVPN to browser the web, your Internet connection is encrypted to ensure that your navigation is secure. ProtonVPN has servers located in 30+ countries around the world.`}</Alert>
            <CyclePromotion model={model} onChange={onChange} />
            <table className="pm-simple-table">
                <thead>
                    <tr>
                        <th />
                        <th className="aligncenter">BASIC</th>
                        <th className="aligncenter">PLUS</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="bg-global-muted">{c('Header').t`Pricing`}</td>
                        <td className="bg-global-muted aligncenter">
                            <Price currency={model.currency} suffix={c('Suffix').t`/mo`}>
                                {vpnBasicPlan.Pricing[model.cycle] / model.cycle}
                            </Price>
                        </td>
                        <td className="bg-global-muted aligncenter">
                            <Price currency={model.currency} suffix={c('Suffix').t`/mo`}>
                                {vpnPlusPlan.Pricing[model.cycle] / model.cycle}
                            </Price>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <span className="mr1">{c('Header').t`Speed`}</span>
                            <Info title={c('Tooltip').t`Download and stream faster with a faster VPN connection.`} />
                        </td>
                        <td className="aligncenter">{c('VPN speed').t`High`}</td>
                        <td className="aligncenter">{c('VPN speed').t`Highest`}</td>
                    </tr>
                    <tr>
                        <td>
                            <span className="mr1">{c('Header').t`Simultaneous connections`}</span>
                            <Info
                                title={c('Tooltip')
                                    .t`More connections allows more devices to use ProtonVPN at the same time.`}
                            />
                        </td>
                        <td className="aligncenter">2</td>
                        <td className="aligncenter">5</td>
                    </tr>
                    {state ? (
                        <tr>
                            <td>{c('Header').t`Advanced encryption`}</td>
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
                            <td>{c('Header').t`No logs policy`}</td>
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
                            <td>{c('Header').t`No data limits`}</td>
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
                            <td>{c('Header').t`P2P support`}</td>
                            <td className="aligncenter">
                                <Icon name="on" />
                            </td>
                            <td className="aligncenter">
                                <Icon name="on" />
                            </td>
                        </tr>
                    ) : null}
                    <tr>
                        <td>{c('Header').t`Secure streaming`}</td>
                        <td className="aligncenter">
                            <Icon name="off" />
                        </td>
                        <td className="aligncenter">
                            <Icon name="on" />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <span className="mr1">{c('Header').t`Tor over VPN`}</span>
                            <Info
                                url="https://protonvpn.com/support/tor-vpn/"
                                title={c('Tooltip').t`Easily route your traffic through the Tor anonymity network.`}
                            />
                        </td>
                        <td className="aligncenter">
                            <Icon name="off" />
                        </td>
                        <td className="aligncenter">
                            <Icon name="on" />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <span className="mr1">{c('Header').t`Secure core`}</span>
                            <Info
                                url="https://protonvpn.com/support/secure-core-vpn/"
                                title={c('Tooltip')
                                    .t`Additional protection by routing your traffic through multiple locations before leaving the ProtonVPN network.`}
                            />
                        </td>
                        <td className="aligncenter">
                            <Icon name="off" />
                        </td>
                        <td className="aligncenter">
                            <Icon name="on" />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <SmallButton className="pm-button--link" onClick={toggle}>
                                {state ? c('Action').t`Hide additional features` : c('Action').t`Compare all features`}
                            </SmallButton>
                        </td>
                        <td className="aligncenter">
                            <Checkbox checked={!!model.plansMap.vpnbasic} onChange={handleCheckboxChange('vpnbasic')} />
                        </td>
                        <td className="aligncenter">
                            <Checkbox checked={!!model.plansMap.vpnplus} onChange={handleCheckboxChange('vpnplus')} />
                        </td>
                    </tr>
                </tbody>
            </table>
            {model.plansMap.vpnplus ? (
                <div className="flex flex-spacebetween pb1 border-bottom">
                    <div>
                        <Select options={vpnOptions} value={model.plansMap['1vpn']} onChange={handleSelectChange} />
                        <Info
                            title={c('Tooltip')
                                .t`Order additional connections to provide ProtonVPN to other users with your organization`}
                        />
                    </div>
                    <div>
                        {model.plansMap['1vpn'] ? (
                            <PlanPrice
                                quantity={model.plansMap['1vpn']}
                                currency={model.currency}
                                amount={vpnAddon.Pricing[model.cycle]}
                                cycle={model.cycle}
                            />
                        ) : (
                            '-'
                        )}
                    </div>
                </div>
            ) : null}
            <div className="flex flex-spacebetween pt1 pb1">
                <div className="bold">
                    ProtonVPN total <CycleDiscountBadge cycle={model.cycle} />
                </div>
                <div className="bold">
                    {subTotal ? (
                        <PlanPrice amount={subTotal} cycle={model.cycle} currency={model.currency} />
                    ) : (
                        c('Price').t`Free`
                    )}
                </div>
            </div>
        </>
    );
};

CustomVPNSection.propTypes = {
    plans: PropTypes.array.isRequired,
    model: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
};

export default CustomVPNSection;
