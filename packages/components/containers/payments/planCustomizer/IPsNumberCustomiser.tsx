import { useMemo } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { type SelectedPlan, getIsVpnPlan } from '@proton/payments';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { NumberCustomiser, type NumberCustomiserProps } from './NumberCustomiser';

interface IPsNumberCustomiserProps extends Omit<NumberCustomiserProps, 'label' | 'tooltip'> {
    selectedPlan: SelectedPlan;
}

export const IPsNumberCustomiser = ({ selectedPlan, ...rest }: IPsNumberCustomiserProps) => {
    const planName = selectedPlan.getPlanName();

    const { label, tooltip } = useMemo(() => {
        const vpnPlanSelected = getIsVpnPlan(planName);
        if (vpnPlanSelected) {
            return {
                label: c('Info').t`Dedicated servers`,
                tooltip: c('Info').t`Number of dedicated servers in the organization`,
            };
        }

        // Avoiding confusion. When user didn't select VPN plan, they might be puzzled what are these "dedicated
        // servers". So we show "Dedicated VPN servers" instead.
        return {
            label: c('Info').t`Dedicated VPN servers`,
            tooltip: c('Info').t`Number of dedicated VPN servers in the organization`,
        };
    }, [planName]);

    return (
        <div>
            <NumberCustomiser label={label} tooltip={tooltip} {...rest} />
            <Href href={getKnowledgeBaseUrl('/add-vpn-servers-organization')}>{c('Link').t`Learn more`}</Href>
        </div>
    );
};
