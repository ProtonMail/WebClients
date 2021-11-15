import { useState } from 'react';
import { c } from 'ttag';
import { PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';
import { switchPlan } from '@proton/shared/lib/helpers/planIDs';
import { Audience, Plan, PlanIDs } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';

import { Tier } from './interface';
import MailFeatures from './MailFeatures';
import ContactFeatures from './ContactFeatures';
import VPNFeatures from './VPNFeatures';
import CalendarFeatures from './CalendarFeatures';
import DriveFeatures from './DriveFeatures';
import HighlightFeatures from './HighlightFeatures';
import TeamFeatures from './TeamFeatures';
import SupportFeatures from './SupportFeatures';

interface Props {
    onChangePlanIDs: (newPlanIDs: PlanIDs) => void;
    plans: Plan[];
    planIDs: PlanIDs;
    audience: Audience;
    hasFreePlan?: boolean;
    selectedPlan: PLANS;
}

const PlanSelectionComparison = ({ selectedPlan, hasFreePlan, audience, onChangePlanIDs, plans, planIDs }: Props) => {
    const [tab, setTab] = useState(0);
    const hasVisionary = !!planIDs[PLANS.NEW_VISIONARY];
    const isB2C = audience === Audience.B2C;

    const planLabels = [
        hasFreePlan && { label: PLAN_NAMES[PLANS.FREE], tier: Tier.free, plan: PLANS.FREE },
        { label: PLAN_NAMES[selectedPlan], tier: Tier.first, plan: selectedPlan },
        {
            label: isB2C ? PLAN_NAMES[PLANS.BUNDLE] : PLAN_NAMES[PLANS.BUNDLE_PRO],
            tier: Tier.second,
            plan: isB2C ? PLANS.BUNDLE : PLANS.BUNDLE_PRO,
        },
        isB2C && {
            label: hasVisionary ? PLAN_NAMES[PLANS.NEW_VISIONARY] : PLAN_NAMES[PLANS.FAMILY],
            tier: Tier.third,
            plan: hasVisionary ? PLANS.NEW_VISIONARY : PLANS.FAMILY,
        },
    ].filter(isTruthy);

    const handleSelect = (planName: PLANS) => {
        const plan = plans.find(({ Name }) => Name === planName);
        onChangePlanIDs(
            switchPlan({
                planIDs,
                planID: plan?.Name,
            })
        );
    };

    return (
        <>
            <HighlightFeatures
                planLabels={planLabels}
                audience={audience}
                onSelect={handleSelect}
                activeTab={tab}
                onSetActiveTab={setTab}
            />
            <MailFeatures
                planLabels={planLabels}
                audience={audience}
                onSelect={handleSelect}
                activeTab={tab}
                onSetActiveTab={setTab}
            />
            <ContactFeatures planLabels={planLabels} onSelect={handleSelect} activeTab={tab} onSetActiveTab={setTab} />
            <CalendarFeatures
                planLabels={planLabels}
                audience={audience}
                onSelect={handleSelect}
                activeTab={tab}
                onSetActiveTab={setTab}
            />
            <DriveFeatures planLabels={planLabels} onSelect={handleSelect} activeTab={tab} onSetActiveTab={setTab} />
            <VPNFeatures
                planLabels={planLabels}
                audience={audience}
                onSelect={handleSelect}
                activeTab={tab}
                onSetActiveTab={setTab}
            />
            {audience === Audience.B2B ? (
                <>
                    <TeamFeatures
                        planLabels={planLabels}
                        onSelect={handleSelect}
                        activeTab={tab}
                        onSetActiveTab={setTab}
                    />
                    <SupportFeatures
                        planLabels={planLabels}
                        onSelect={handleSelect}
                        activeTab={tab}
                        onSetActiveTab={setTab}
                    />
                </>
            ) : null}
            <p className="text-sm mt1 mb0-5 color-weak">
                *{' '}
                {c('Info concerning plan features')
                    .t`Get started with 1 GB total storage, with incentives to unlock up to 1 additional GB.`}
            </p>
        </>
    );
};

export default PlanSelectionComparison;
