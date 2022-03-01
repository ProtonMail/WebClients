import { c } from 'ttag';
import React from 'react';
import { Audience } from '@proton/shared/lib/interfaces';
import { PLANS } from '@proton/shared/lib/constants';
import { CalendarLogo, DriveLogo, Icon, Info, MailLogo, VpnLogo } from '../../../components';
import { AllFeatures, getFeatureDefinitions } from '../features';
import { PlanCardFeatureDefinition, ShortPlan } from '../features/interface';
import { classnames } from '../../../helpers';

interface FeatureListProps {
    features: PlanCardFeatureDefinition[];
}

const PlanCardFeatureList = ({ features }: FeatureListProps) => {
    return (
        <ul className="bg-weak-even unstyled">
            {features.map((feature) => {
                return (
                    <li key={feature.featureName} className="px1 py0-5 flex flex-align-items-center">
                        <div className={classnames([!feature.included && 'color-weak'])}>
                            {feature.fire ? (
                                <>🔥</>
                            ) : feature.included ? (
                                <span className="color-success">
                                    <Icon size={24} name="check" />
                                </span>
                            ) : (
                                <Icon size={24} name="xmark" />
                            )}
                            {feature.featureName}
                            {feature.tooltip ? <Info className="ml0-5" title={feature.tooltip} /> : null}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};

interface Props {
    planName: PLANS;
    features: AllFeatures;
    audience: Audience;
}

const PlanCardFeatures = ({ planName, features, audience }: Props) => {
    const highlightFeatures = (
        <div>
            <PlanCardFeatureList features={getFeatureDefinitions(planName, features.highlight, audience)} />
        </div>
    );
    const mailFeatures = (
        <div>
            <MailLogo />
            <PlanCardFeatureList features={getFeatureDefinitions(planName, features.mail, audience)} />
        </div>
    );
    const calendarFeatures = (
        <div>
            <CalendarLogo />
            <PlanCardFeatureList features={getFeatureDefinitions(planName, features.calendar, audience)} />
        </div>
    );
    const driveFeatures = (
        <div>
            <DriveLogo />
            <PlanCardFeatureList features={getFeatureDefinitions(planName, features.drive, audience)} />
        </div>
    );
    const vpnFeatures = (
        <div>
            <VpnLogo />
            <PlanCardFeatureList features={getFeatureDefinitions(planName, features.vpn, audience)} />
        </div>
    );
    const teamFeatures = audience === Audience.B2B && planName !== PLANS.FREE && (
        <div>
            <h2>{c('new_plans').t`Team management`}</h2>
            <PlanCardFeatureList features={getFeatureDefinitions(planName, features.team, audience)} />
        </div>
    );
    const supportFeatures = audience === Audience.B2B && planName !== PLANS.FREE && (
        <div>
            <h2>{c('new_plans').t`Support`}</h2>
            <PlanCardFeatureList features={getFeatureDefinitions(planName, features.support, audience)} />
        </div>
    );
    return (
        <>
            {highlightFeatures}
            {mailFeatures}
            {calendarFeatures}
            {driveFeatures}
            {vpnFeatures}
            {teamFeatures}
            {supportFeatures}
        </>
    );
};

interface PlanCardFeaturesShortProps {
    plan: ShortPlan;
}

export const PlanCardFeaturesShort = ({ plan }: PlanCardFeaturesShortProps) => {
    const highlightFeatures = (
        <div>
            <PlanCardFeatureList features={plan.features} />
        </div>
    );
    return <>{highlightFeatures}</>;
};

export default PlanCardFeatures;
