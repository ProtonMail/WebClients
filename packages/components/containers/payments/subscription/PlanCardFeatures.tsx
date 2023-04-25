import React from 'react';

import { c } from 'ttag';

import { PLANS } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { CalendarLogo, DriveLogo, Icon, Info, MailLogo, PassLogo, VpnLogo } from '../../../components';
import { AllFeatures, getFeatureDefinitions } from '../features';
import { PlanCardFeatureDefinition, ShortPlan } from '../features/interface';

interface FeatureListProps {
    features: PlanCardFeatureDefinition[];
    icon?: boolean;
    fire?: boolean;
}

export const PlanCardFeatureList = ({ features, icon, fire = true }: FeatureListProps) => {
    return (
        <ul className="bg-weak-odd unstyled mt-4 mb-0 md:mb-8">
            {features.map((feature) => {
                const iconToDisplay = (() => {
                    if (feature.fire && fire) {
                        return <Icon size={20} name="fire" className="color-warning" />;
                    }

                    if (feature.included) {
                        return (
                            <span className="color-success">
                                {icon && feature.icon ? (
                                    <Icon size={20} name={feature.icon} />
                                ) : (
                                    <Icon size={20} name="checkmark" />
                                )}
                            </span>
                        );
                    }

                    return <Icon size={20} name="cross" className="mt-0.5" />;
                })();

                const key =
                    typeof feature.text === 'string'
                        ? feature.text
                        : `${feature.tooltip}-${feature.fire}-${feature.icon}`;
                return (
                    <li key={key} className="px0-75 py0-5 flex rounded">
                        <div
                            className={clsx(
                                'flex-no-min-children flex-nowrap',
                                !feature.included && 'color-hint',
                                feature.included && feature.status === 'coming-soon' && 'color-weak'
                            )}
                        >
                            <span className="flex flex-item-noshrink mr-3">{iconToDisplay}</span>
                            <span className="flex-item-fluid text-left">
                                <span className="mr-2 align-middle">{feature.text}</span>
                                {feature.tooltip ? (
                                    <Info
                                        className="align-middle"
                                        title={feature.tooltip}
                                        colorPrimary={feature.included}
                                    />
                                ) : null}
                            </span>
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
    isPassPlusEnabled: boolean;
    audience: Audience;
}

const PlanCardFeatures = ({ planName, features, audience, isPassPlusEnabled }: Props) => {
    const highlightFeatures = (
        <div>
            <PlanCardFeatureList features={getFeatureDefinitions(planName, features.highlight, audience)} />
        </div>
    );
    const mailFeatures = (
        <div>
            <h3>
                <MailLogo />
            </h3>
            <PlanCardFeatureList features={getFeatureDefinitions(planName, features.mail, audience)} />
        </div>
    );
    const calendarFeatures = (
        <div>
            <h3>
                <CalendarLogo />
            </h3>
            <PlanCardFeatureList features={getFeatureDefinitions(planName, features.calendar, audience)} />
        </div>
    );
    const driveFeatures = (
        <div>
            <h3>
                <DriveLogo />
            </h3>
            <PlanCardFeatureList features={getFeatureDefinitions(planName, features.drive, audience)} />
        </div>
    );
    const passFeatures = (
        <div>
            <h3>
                <PassLogo />
            </h3>
            <PlanCardFeatureList features={getFeatureDefinitions(planName, features.pass, audience)} />
        </div>
    );
    const vpnFeatures = (
        <div>
            <h3>
                <VpnLogo />
            </h3>
            <PlanCardFeatureList features={getFeatureDefinitions(planName, features.vpn, audience)} />
        </div>
    );
    const teamFeatures = audience === Audience.B2B && planName !== PLANS.FREE && (
        <div>
            <h3 className="h4 text-bold">{c('new_plans: heading').t`Team management`}</h3>
            <PlanCardFeatureList features={getFeatureDefinitions(planName, features.team, audience)} />
        </div>
    );
    const supportFeatures = audience === Audience.B2B && planName !== PLANS.FREE && (
        <div>
            <h3 className="h4 text-bold">{c('new_plans: heading').t`Support`}</h3>
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
            {isPassPlusEnabled ? passFeatures : null}
            {teamFeatures}
            {supportFeatures}
        </>
    );
};

interface PlanCardFeaturesShortProps {
    plan: ShortPlan;
    icon?: boolean;
}

export const PlanCardFeaturesShort = ({ plan, icon }: PlanCardFeaturesShortProps) => {
    const highlightFeatures = (
        <div>
            <PlanCardFeatureList features={plan.features} icon={icon} fire={false} />
        </div>
    );
    return <>{highlightFeatures}</>;
};

export default PlanCardFeatures;
