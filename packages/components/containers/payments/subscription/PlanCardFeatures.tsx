import React from 'react';

import { c } from 'ttag';

import { PLANS } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { CalendarLogo, DriveLogo, Icon, IconSize, Info, MailLogo, PassLogo, VpnLogo } from '../../../components';
import { AllFeatures, getFeatureDefinitions } from '../features';
import { PlanCardFeatureDefinition, ShortPlan } from '../features/interface';

interface FeatureListProps {
    features: PlanCardFeatureDefinition[];
    icon?: boolean;
    highlight?: boolean;
    margin?: boolean;
    odd?: boolean;
    tooltip?: boolean;
    iconSize?: IconSize;
    className?: string;
    itemClassName?: string;
    gapClassName?: string;
}

export const PlanCardFeatureList = ({
    odd = true,
    features,
    icon,
    highlight = false,
    margin = true,
    tooltip = true,
    iconSize = 20,
    className,
    itemClassName,
}: FeatureListProps) => {
    if (!features.length) {
        return null;
    }
    return (
        <ul
            className={clsx(
                'unstyled flex flex-column',
                className,
                odd && 'bg-weak-odd',
                margin ? 'mt-4 mb-0 md:mb-6' : 'm-0'
            )}
        >
            {features.map((feature) => {
                const iconToDisplay = (() => {
                    if (feature.highlight && highlight) {
                        return <Icon size={iconSize} name="fire" className="color-warning" />;
                    }

                    if (feature.included) {
                        return (
                            <span className="color-success">
                                {icon && feature.icon ? (
                                    <Icon size={iconSize} name={feature.icon} />
                                ) : (
                                    <Icon size={iconSize} name="checkmark" />
                                )}
                            </span>
                        );
                    }

                    return <Icon size={iconSize} name="cross" className="mt-0.5" />;
                })();

                const key =
                    typeof feature.text === 'string'
                        ? feature.text
                        : `${feature.tooltip}-${feature.highlight}-${feature.icon}`;
                return (
                    <li key={key} className={clsx(odd && 'px-3 py-2 rounded', itemClassName, 'flex')}>
                        <div
                            className={clsx(
                                'flex-no-min-children flex-nowrap',
                                !feature.included && 'color-hint',
                                feature.included && feature.status === 'coming-soon' && 'color-weak'
                            )}
                        >
                            <span className={clsx('flex flex-item-noshrink', iconSize < 20 ? 'mr-1' : 'mr-3')}>
                                {iconToDisplay}
                            </span>
                            <span className="flex-item-fluid text-left">
                                <span className="mr-2 align-middle">{feature.text}</span>
                                {tooltip && feature.tooltip ? (
                                    <Info
                                        url={feature.iconUrl}
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
    audience: Audience;
}

const PlanCardFeatures = ({ planName, features, audience }: Props) => {
    const highlightFeatures = (
        <div data-testid={planName}>
            <PlanCardFeatureList features={getFeatureDefinitions(planName, features.highlight, audience)} />
        </div>
    );
    const mailFeatures = (
        <div data-testid={`${planName}-mail`}>
            <h3>
                <MailLogo />
            </h3>
            <PlanCardFeatureList features={getFeatureDefinitions(planName, features.mail, audience)} />
        </div>
    );
    const calendarFeatures = (
        <div data-testid={`${planName}-calendar`}>
            <h3>
                <CalendarLogo />
            </h3>
            <PlanCardFeatureList features={getFeatureDefinitions(planName, features.calendar, audience)} />
        </div>
    );
    const driveFeatures = (
        <div data-testid={`${planName}-drive`}>
            <h3>
                <DriveLogo />
            </h3>
            <PlanCardFeatureList features={getFeatureDefinitions(planName, features.drive, audience)} />
        </div>
    );
    const passFeatures = (
        <div data-testid={`${planName}-pass`}>
            <h3>
                <PassLogo />
            </h3>
            <PlanCardFeatureList features={getFeatureDefinitions(planName, features.pass, audience)} />
        </div>
    );
    const vpnFeatures = (
        <div data-testid={`${planName}-vpn`}>
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
            {passFeatures}
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
            <PlanCardFeatureList features={plan.features} icon={icon} />
        </div>
    );
    return <>{highlightFeatures}</>;
};

export default PlanCardFeatures;
