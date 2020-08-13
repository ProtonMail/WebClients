import React from 'react';
import PropTypes from 'prop-types';
import { PLAN_NAMES, PLANS, CYCLE, CURRENCIES } from 'proton-shared/lib/constants';
import { toMap } from 'proton-shared/lib/helpers/object';
import { c } from 'ttag';
import freePlanSvg from 'design-system/assets/img/pv-images/plans/free-plan.svg';
import plusPlanSvg from 'design-system/assets/img/pv-images/plans/vpnbasic-plan.svg';
import professionalPlanSvg from 'design-system/assets/img/pv-images/plans/vpnplus-plan.svg';
import visionaryPlanSvg from 'design-system/assets/img/pv-images/plans/visionary-plan.svg';

import { LinkButton } from '../../../components';
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
                { icon: 'arrow-right', content: c('Feature').t`No logs/No ads` },
                {
                    icon: 'close',
                    content: (
                        <del className="opacity-50" key="filesharing">{c('Feature')
                            .t`Filesharing/bitorrent support`}</del>
                    ),
                },
                {
                    icon: 'close',
                    content: <del className="opacity-50" key="secure">{c('Feature').t`Secure Core and Tor VPN`}</del>,
                },
                {
                    icon: 'close',
                    content: (
                        <del className="opacity-50" key="advanced">{c('Feature').t`Advanced privacy features`}</del>
                    ),
                },
                {
                    icon: 'close',
                    content: <del className="opacity-50" key="access">{c('Feature').t`Access blocked content`}</del>,
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
                { icon: 'arrow-right', content: c('Feature').t`No logs/No ads` },
                { icon: 'arrow-right', content: c('Feature').t`Filesharing/bitorrent support` },
                {
                    icon: 'close',
                    content: <del className="opacity-50" key="secure">{c('Feature').t`Secure Core and Tor VPN`}</del>,
                },
                {
                    icon: 'close',
                    content: (
                        <del className="opacity-50" key="advanced">{c('Feature').t`Advanced privacy features`}</del>
                    ),
                },
                {
                    icon: 'close',
                    content: <del className="opacity-50" key="access">{c('Feature').t`Access blocked content`}</del>,
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
                { icon: 'arrow-right', content: c('Feature').t`Highest speed (10 Gbps)` },
                { icon: 'arrow-right', content: c('Feature').t`No logs/No ads` },
                { icon: 'arrow-right', content: c('Feature').t`Filesharing/bitorrent support` },
                { icon: 'arrow-right', content: c('Feature').t`Secure Core and Tor VPN` },
                { icon: 'arrow-right', content: c('Feature').t`Advanced privacy features` },
                { icon: 'arrow-right', content: c('Feature').t`Access blocked content` },
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
                { icon: 'arrow-right', content: c('Feature').t`ProtonMail Visionary account` },
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
            <div className="aligncenter pb1 onmobile-pb2 subscriptionTable-show-features-container">
                <LinkButton
                    className="pm-button--small"
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
