import React from 'react';
import PropTypes from 'prop-types';
import { toMap } from 'proton-shared/lib/helpers/object';
import { PLANS } from 'proton-shared/lib/constants';
import { c } from 'ttag';

import { Loader } from '../../../components';
import { usePlans, useVPNCountries } from '../../../hooks';
import SubscriptionPrices from './SubscriptionPrices';

const VpnFeaturesTable = ({ cycle, currency }) => {
    const [vpnCountries, loadingVpnCountries] = useVPNCountries();
    const [plans, loadingPlans] = usePlans();
    const plansMap = toMap(plans, 'Name');

    if (loadingPlans || loadingVpnCountries) {
        return <Loader />;
    }

    return (
        <>
            <table className="pm-simple-table pm-simple-table--alternate-bg-row pm-simple-table--bordered w100">
                <thead>
                    <tr>
                        <th className="aligncenter aligntop pm-simple-table-row-th pt1">
                            <div className="uppercase">Free</div>
                            <SubscriptionPrices cycle={cycle} currency={currency} />
                        </th>
                        <th className="aligncenter aligntop pm-simple-table-row-th pt1">
                            <div className="uppercase">Basic</div>
                            <SubscriptionPrices cycle={cycle} currency={currency} plan={plansMap[PLANS.VPNBASIC]} />
                        </th>
                        <th className="aligncenter aligntop pm-simple-table-row-th pt1">
                            <div className="uppercase">Plus</div>
                            <SubscriptionPrices cycle={cycle} currency={currency} plan={plansMap[PLANS.VPNPLUS]} />
                        </th>
                        <th className="aligncenter aligntop pm-simple-table-row-th pt1">
                            <div className="uppercase">Visionary</div>
                            <SubscriptionPrices cycle={cycle} currency={currency} plan={plansMap[PLANS.VISIONARY]} />
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{c('Feature').t`1 VPN connection`}</td>
                        <td>{c('Feature').t`2 VPN connections`}</td>
                        <td>{c('Feature').t`5 VPN connections`}</td>
                        <td>{c('Feature').t`10 VPN connections`}</td>
                    </tr>
                    <tr>
                        <td>{c('Feature').t`Servers in ${vpnCountries.free.length} countries`}</td>
                        <td>{c('Feature').t`Servers in ${vpnCountries.basic.length} countries`}</td>
                        <td>{c('Feature').t`Servers in ${vpnCountries.all.length} countries`}</td>
                        <td>{c('Feature').t`Servers in ${vpnCountries.all.length} countries`}</td>
                    </tr>
                    <tr>
                        <td>{c('Feature').t`Medium speed`}</td>
                        <td>{c('Feature').t`High speed`}</td>
                        <td>{c('Feature').t`Highest speed (up to 10Gbps)`}</td>
                        <td>{c('Feature').t`Highest speed (10Gbps)`}</td>
                    </tr>
                    <tr>
                        <td>
                            <del>{c('Feature').t`Filesharing / P2P`}</del>
                        </td>
                        <td>{c('Feature').t`Filesharing / P2P`}</td>
                        <td>{c('Feature').t`Filesharing / P2P`}</td>
                        <td>{c('Feature').t`Filesharing / P2P`}</td>
                    </tr>
                    <tr>
                        <td>
                            <del>{c('Feature').t`Secure Core and Tor VPN`}</del>
                        </td>
                        <td>
                            <del>{c('Feature').t`Secure Core and Tor VPN`}</del>
                        </td>
                        <td>{c('Feature').t`Secure Core and Tor VPN`}</td>
                        <td>{c('Feature').t`Secure Core and Tor VPN`}</td>
                    </tr>
                    <tr>
                        <td>
                            <del>{c('Feature').t`Advanced privacy features`}</del>
                        </td>
                        <td>
                            <del>{c('Feature').t`Advanced privacy features`}</del>
                        </td>
                        <td>{c('Feature').t`Advanced privacy features`}</td>
                        <td>{c('Feature').t`Advanced privacy features`}</td>
                    </tr>
                    <tr>
                        <td>
                            <del>{c('Feature').t`Access blocked content`}</del>
                        </td>
                        <td>
                            <del>{c('Feature').t`Access blocked content`}</del>
                        </td>
                        <td>{c('Feature').t`Access blocked content`}</td>
                        <td>{c('Feature').t`Access blocked content`}</td>
                    </tr>
                    <tr>
                        <td>{c('Feature').t`ProtonMail (optional) *`}</td>
                        <td>{c('Feature').t`ProtonMail (optional) *`}</td>
                        <td>{c('Feature').t`ProtonMail (optional) *`}</td>
                        <td>{c('Feature').t`ProtonMail included`}</td>
                    </tr>
                    <tr>
                        <td colSpan={4}>{c('Feature').t`No logs / no ads`}</td>
                    </tr>
                    <tr>
                        <td colSpan={4}>{c('Feature').t`Perfect Forward Secrecy (PFS)`}</td>
                    </tr>
                    <tr>
                        <td colSpan={4}>{c('Feature').t`AES-256 encryption`}</td>
                    </tr>
                    <tr>
                        <td colSpan={4}>{c('Feature').t`DNS leak protection`}</td>
                    </tr>
                    <tr>
                        <td colSpan={4}>{c('Feature').t`Kill Switch`}</td>
                    </tr>
                    <tr>
                        <td colSpan={4}>{c('Feature').t`Always-on VPN`}</td>
                    </tr>
                    <tr>
                        <td colSpan={4}>{c('Feature').t`Open Source`}</td>
                    </tr>
                    <tr>
                        <td colSpan={4}>{c('Feature').t`10 Gpbs servers`}</td>
                    </tr>
                    <tr>
                        <td colSpan={4}>{c('Feature').t`Split tunneling support`}</td>
                    </tr>
                    <tr>
                        <td colSpan={4}>{c('Feature').t`Swiss based`}</td>
                    </tr>
                    <tr>
                        <td colSpan={4}>{c('Feature').t`Professional support`}</td>
                    </tr>
                </tbody>
            </table>
            <p className="small mt1 mb0">* {c('Info concerning plan features').t`Denotes customizable features`}</p>
        </>
    );
};

VpnFeaturesTable.propTypes = {
    cycle: PropTypes.number,
    currency: PropTypes.string,
};

export default VpnFeaturesTable;
