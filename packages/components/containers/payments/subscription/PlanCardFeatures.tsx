import type { ReactNode } from 'react';
import { cloneElement, isValidElement } from 'react';

import { c } from 'ttag';

import Icon, { type IconSize } from '@proton/components/components/icon/Icon';
import Info from '@proton/components/components/link/Info';
import { PLANS } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash';
import clsx from '@proton/utils/clsx';

import { CalendarLogo, DriveLogo, MailLogo, PassLogo, VpnLogo, WalletLogo } from '../../../components';
import type { AllFeatures } from '../features';
import { getFeatureDefinitions } from '../features';
import type { PlanCardFeatureDefinition, ShortPlan } from '../features/interface';

interface FeatureListProps {
    features: PlanCardFeatureDefinition[];
    icon?: boolean | ReactNode;
    highlight?: boolean;
    margin?: boolean;
    odd?: boolean;
    tooltip?: boolean;
    iconSize?: IconSize;
    className?: string;
    iconColor?: string;
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
    iconSize = 5,
    iconColor = 'color-success',
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
                odd && 'odd:bg-weak',
                margin ? 'mt-4 mb-0 md:mb-6' : 'm-0'
            )}
        >
            {features.map((feature) => {
                const iconToDisplay = (() => {
                    if (
                        icon !== true &&
                        icon !== false &&
                        icon !== undefined &&
                        icon !== null &&
                        isValidElement<{
                            size: IconSize;
                        }>(icon)
                    ) {
                        return cloneElement(icon, { size: iconSize });
                    }

                    if (feature.highlight && highlight) {
                        return <Icon size={iconSize} name="fire" className="color-warning" />;
                    }

                    if (feature.included) {
                        return (
                            <span className={iconColor}>
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
                                'flex *:min-size-auto flex-nowrap',
                                !feature.included && 'color-hint',
                                feature.included && feature.status === 'coming-soon' && 'color-weak'
                            )}
                        >
                            <span className={clsx('flex shrink-0', iconSize < 5 ? 'mr-1' : 'mr-3')}>
                                {iconToDisplay}
                            </span>
                            <span className="flex-1 text-left">
                                <span className="mr-2 align-middle">
                                    {feature.text}
                                    {feature.subtext && (
                                        <>
                                            <br />
                                            <span className="text-sm">{feature.subtext}</span>
                                        </>
                                    )}
                                </span>
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
    const canAccessWalletPlan = useFlag('WalletPlan');

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

    const showWalletFeatures = canAccessWalletPlan && audience !== Audience.B2B;

    const walletFeatures = showWalletFeatures ? (
        <div data-testid={`${planName}-wallet`}>
            <h3>
                <WalletLogo />
            </h3>
            <PlanCardFeatureList features={getFeatureDefinitions(planName, features.wallet, audience)} />
        </div>
    ) : null;
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
            {walletFeatures}
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
