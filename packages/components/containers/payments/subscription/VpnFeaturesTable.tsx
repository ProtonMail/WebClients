import React from 'react';
import { c } from 'ttag';
import { toMap } from 'proton-shared/lib/helpers/object';
import { PLANS } from 'proton-shared/lib/constants';
import { Currency, Cycle } from 'proton-shared/lib/interfaces';

import { Loader } from '../../../components';
import { usePlans, useVPNCountries } from '../../../hooks';
import SubscriptionPrices from './SubscriptionPrices';

interface Props {
    cycle: Cycle;
    currency: Currency;
}

const VpnFeaturesTable = ({ cycle, currency }: Props) => {
    const [vpnCountries, loadingVpnCountries] = useVPNCountries();
    const [plans, loadingPlans] = usePlans();
    const plansMap = toMap(plans, 'Name');

    if (loadingPlans || loadingVpnCountries) {
        return <Loader />;
    }

    return (
        <table className="simple-table simple-table--alternate-bg-row simple-table--bordered w100">
            <thead>
                <tr>
                    <th className="text-center align-top simple-table-row-th pt1">
                        <div className="text-uppercase text-ellipsis" title="Free">
                            Free
                        </div>
                        <SubscriptionPrices cycle={cycle} currency={currency} />
                    </th>
                    <th className="text-center align-top simple-table-row-th pt1">
                        <div className="text-uppercase text-ellipsis" title="Basic">
                            Basic
                        </div>
                        <SubscriptionPrices cycle={cycle} currency={currency} plan={plansMap[PLANS.VPNBASIC]} />
                    </th>
                    <th className="text-center align-top simple-table-row-th pt1">
                        <div className="text-uppercase text-ellipsis" title="Plus">
                            Plus
                        </div>
                        <SubscriptionPrices cycle={cycle} currency={currency} plan={plansMap[PLANS.VPNPLUS]} />
                    </th>
                    <th className="text-center align-top simple-table-row-th pt1">
                        <div className="text-uppercase text-ellipsis" title="Visionary">
                            Visionary
                        </div>
                        <SubscriptionPrices cycle={cycle} currency={currency} plan={plansMap[PLANS.VISIONARY]} />
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td className="scroll-if-needed">{c('Feature').t`1 VPN connection`}</td>
                    <td className="scroll-if-needed">{c('Feature').t`2 VPN connections`}</td>
                    <td className="scroll-if-needed">{c('Feature').t`5 VPN connections`}</td>
                    <td className="scroll-if-needed">{c('Feature').t`10 VPN connections`}</td>
                </tr>
                <tr>
                    <td className="scroll-if-needed">{c('Feature')
                        .t`Servers in ${vpnCountries.free.length} countries`}</td>
                    <td className="scroll-if-needed">{c('Feature')
                        .t`Servers in ${vpnCountries.basic.length} countries`}</td>
                    <td className="scroll-if-needed">{c('Feature')
                        .t`Servers in ${vpnCountries.all.length} countries`}</td>
                    <td className="scroll-if-needed">{c('Feature')
                        .t`Servers in ${vpnCountries.all.length} countries`}</td>
                </tr>
                <tr>
                    <td className="scroll-if-needed">{c('Feature').t`Medium speed`}</td>
                    <td className="scroll-if-needed">{c('Feature').t`High speed`}</td>
                    <td className="scroll-if-needed">{c('Feature').t`Highest speed (up to 10Gbps)`}</td>
                    <td className="scroll-if-needed">{c('Feature').t`Highest speed (10Gbps)`}</td>
                </tr>
                <tr>
                    <td className="scroll-if-needed">
                        <del>{c('Feature').t`Filesharing / P2P`}</del>
                    </td>
                    <td className="scroll-if-needed">{c('Feature').t`Filesharing / P2P`}</td>
                    <td className="scroll-if-needed">{c('Feature').t`Filesharing / P2P`}</td>
                    <td className="scroll-if-needed">{c('Feature').t`Filesharing / P2P`}</td>
                </tr>
                <tr>
                    <td className="scroll-if-needed">
                        <del>{c('Feature').t`Adblocker (NetShield)`}</del>
                    </td>
                    <td className="scroll-if-needed">{c('Feature').t`Adblocker (NetShield)`}</td>
                    <td className="scroll-if-needed">{c('Feature').t`Adblocker (NetShield)`}</td>
                    <td className="scroll-if-needed">{c('Feature').t`Adblocker (NetShield)`}</td>
                </tr>
                <tr>
                    <td className="scroll-if-needed">
                        <del>{c('Feature').t`Secure Core and Tor VPN`}</del>
                    </td>
                    <td className="scroll-if-needed">
                        <del>{c('Feature').t`Secure Core and Tor VPN`}</del>
                    </td>
                    <td className="scroll-if-needed">{c('Feature').t`Secure Core and Tor VPN`}</td>
                    <td className="scroll-if-needed">{c('Feature').t`Secure Core and Tor VPN`}</td>
                </tr>
                <tr>
                    <td className="scroll-if-needed">
                        <del>{c('Feature').t`Advanced privacy features`}</del>
                    </td>
                    <td className="scroll-if-needed">
                        <del>{c('Feature').t`Advanced privacy features`}</del>
                    </td>
                    <td className="scroll-if-needed">{c('Feature').t`Advanced privacy features`}</td>
                    <td className="scroll-if-needed">{c('Feature').t`Advanced privacy features`}</td>
                </tr>
                <tr>
                    <td className="scroll-if-needed">
                        <del>{c('Feature').t`Access blocked content`}</del>
                    </td>
                    <td className="scroll-if-needed">
                        <del>{c('Feature').t`Access blocked content`}</del>
                    </td>
                    <td className="scroll-if-needed">{c('Feature').t`Access blocked content`}</td>
                    <td className="scroll-if-needed">{c('Feature').t`Access blocked content`}</td>
                </tr>
                <tr>
                    <td className="scroll-if-needed">{c('Feature').t`ProtonMail (optional)*`}</td>
                    <td className="scroll-if-needed">{c('Feature').t`ProtonMail (optional)*`}</td>
                    <td className="scroll-if-needed">{c('Feature').t`ProtonMail (optional)*`}</td>
                    <td className="scroll-if-needed">{c('Feature').t`ProtonMail included`}</td>
                </tr>
                <tr>
                    <td colSpan={4}>{c('Feature').t`Strict no-logs policy`}</td>
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
                    <td colSpan={4}>{c('Feature').t`10 Gbps servers`}</td>
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
    );
};

export default VpnFeaturesTable;
