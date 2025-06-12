import type { ReactNode } from 'react';
import { cloneElement, isValidElement, useState } from 'react';

import { c } from 'ttag';

import Icon, { type IconSize } from '@proton/components/components/icon/Icon';
import Info from '@proton/components/components/link/Info';
import CalendarLogo from '@proton/components/components/logo/CalendarLogo';
import DriveLogo from '@proton/components/components/logo/DriveLogo';
import LumoLogo from '@proton/components/components/logo/LumoLogo';
import MailLogo from '@proton/components/components/logo/MailLogo';
import PassLogo from '@proton/components/components/logo/PassLogo';
import VpnLogo from '@proton/components/components/logo/VpnLogo';
import WalletLogo from '@proton/components/components/logo/WalletLogo';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { IcChevronRight } from '@proton/icons';
import { PLANS } from '@proton/payments';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { APPS } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import type { AllFeatures } from '../features';
import { getFeatureDefinitions } from '../features';
import type { PlanCardFeatureDefinition, ShortPlan } from '../features/interface';

interface FeatureListProps extends Omit<PlanCardFeatureListProps, 'features' | 'keyFeatures'> {
    featureArray: PlanCardFeatureDefinition[];
}

const FeatureList = ({
    featureArray,
    className,
    odd,
    margin,
    iconSize = 5,
    icon,
    highlight,
    iconColor,
    tooltip,
    itemClassName,
}: FeatureListProps) => (
    <ul
        className={clsx(
            'unstyled flex flex-column',
            className,
            odd && 'odd:bg-weak',
            margin ? 'mt-4 mb-0 md:mb-6' : 'm-0'
        )}
    >
        {featureArray.map((feature, i) => {
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

            return (
                <li
                    key={
                        // Key by index so that we can skeleton load certain features - eg the vpn countries
                        i
                    }
                    className={clsx(odd && 'px-3 py-2 rounded', itemClassName, 'flex')}
                >
                    <div
                        className={clsx(
                            'flex *:min-size-auto flex-nowrap',
                            !feature.included && 'color-hint',
                            feature.included && feature.status === 'coming-soon' && 'color-weak'
                        )}
                    >
                        <span className={clsx('flex shrink-0', iconSize < 5 ? 'mr-1' : 'mr-3')}>{iconToDisplay}</span>
                        <span className="flex-1 text-left text-wrap-balance">
                            <span className="align-middle">
                                <span>
                                    {feature.text}
                                    {tooltip && feature.tooltip ? (
                                        <Info
                                            url={feature.iconUrl}
                                            className="align-middle ml-1"
                                            title={feature.tooltip}
                                            colorPrimary={feature.included}
                                        />
                                    ) : null}
                                </span>
                                {feature.subtext && (
                                    <>
                                        <br />
                                        <span className="text-sm">{feature.subtext}</span>
                                    </>
                                )}
                            </span>
                        </span>
                    </div>
                </li>
            );
        })}
    </ul>
);

interface PlanCardFeatureListProps {
    features: PlanCardFeatureDefinition[];
    keyFeatures?: PlanCardFeatureDefinition[];
    icon?: boolean | ReactNode;
    highlight?: boolean;
    margin?: boolean;
    odd?: boolean;
    tooltip?: boolean;
    iconSize?: IconSize;
    className?: string;
    iconColor?: string;
    itemClassName?: string;
}

export const PlanCardFeatureList = ({
    features,
    keyFeatures,
    icon,
    odd = true,
    highlight = false,
    margin = true,
    tooltip = true,
    iconSize,
    iconColor = 'color-success',
    className,
    itemClassName,
}: PlanCardFeatureListProps) => {
    const { viewportWidth } = useActiveBreakpoint();
    const [showAllFeatures, setShowAllFeatures] = useState(false);

    if (!features.length) {
        return null;
    }

    // Show toggle on smaller viewports when key features exist
    if (viewportWidth['<=medium'] && keyFeatures?.length) {
        return (
            <>
                <FeatureList
                    featureArray={showAllFeatures ? features : keyFeatures}
                    className={className}
                    odd={odd}
                    margin={margin}
                    iconSize={iconSize}
                    icon={icon}
                    highlight={highlight}
                    iconColor={iconColor}
                    tooltip={tooltip}
                    itemClassName={itemClassName}
                />
                <button
                    type="button"
                    className="color-primary text-sm relative interactive-pseudo-protrude"
                    aria-label={showAllFeatures ? c('Action').t`Hide more benefits` : c('Action').t`Show more benefits`}
                    onClick={() => setShowAllFeatures(!showAllFeatures)}
                >
                    <span className="flex items-center gap-1">
                        <IcChevronRight
                            size={4}
                            className={clsx('shrink-0 transition-transform', showAllFeatures && 'rotateZ-270')}
                        />
                        <span>{showAllFeatures ? c('Action').t`Hide` : c('Action').t`More benefits`}</span>
                    </span>
                </button>
            </>
        );
    }

    return (
        <FeatureList
            featureArray={features}
            className={className}
            odd={odd}
            margin={margin}
            iconSize={iconSize}
            icon={icon}
            highlight={highlight}
            iconColor={iconColor}
            tooltip={tooltip}
            itemClassName={itemClassName}
        />
    );
};

interface Props {
    planName: PLANS;
    features: AllFeatures;
    audience: Audience;
    app: ProductParam;
}

const PlanCardFeatures = ({ planName, features, audience, app }: Props) => {
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

    const walletFeatures = (
        <div data-testid={`${planName}-wallet`}>
            <h3>
                <WalletLogo />
            </h3>
            <PlanCardFeatureList features={getFeatureDefinitions(planName, features.wallet, audience)} />
        </div>
    );
    const lumoFeatures = (
        <div data-testid={`${planName}-lumo`}>
            <h3>
                <LumoLogo />
            </h3>
            <PlanCardFeatureList features={getFeatureDefinitions(planName, features.lumo, audience)} />
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

    if (app === APPS.PROTONPASS) {
        return (
            <>
                {highlightFeatures}
                {passFeatures}
                {mailFeatures}
                {calendarFeatures}
                {driveFeatures}
                {vpnFeatures}
                {walletFeatures}
                {lumoFeatures}
                {teamFeatures}
                {supportFeatures}
            </>
        );
    }

    if (app === APPS.PROTONVPN_SETTINGS) {
        return (
            <>
                {highlightFeatures}
                {vpnFeatures}
                {mailFeatures}
                {calendarFeatures}
                {driveFeatures}
                {passFeatures}
                {walletFeatures}
                {lumoFeatures}
                {teamFeatures}
                {supportFeatures}
            </>
        );
    }

    if (app === APPS.PROTONDRIVE) {
        return (
            <>
                {highlightFeatures}
                {driveFeatures}
                {mailFeatures}
                {calendarFeatures}
                {vpnFeatures}
                {passFeatures}
                {walletFeatures}
                {lumoFeatures}
                {teamFeatures}
                {supportFeatures}
            </>
        );
    }

    if (app === APPS.PROTONWALLET) {
        return (
            <>
                {highlightFeatures}
                {walletFeatures}
                {mailFeatures}
                {calendarFeatures}
                {driveFeatures}
                {vpnFeatures}
                {passFeatures}
                {lumoFeatures}
                {teamFeatures}
                {supportFeatures}
            </>
        );
    }

    if (app === APPS.PROTONLUMO) {
        return (
            <>
                {highlightFeatures}
                {lumoFeatures}
                {walletFeatures}
                {mailFeatures}
                {calendarFeatures}
                {driveFeatures}
                {vpnFeatures}
                {passFeatures}
                {teamFeatures}
                {supportFeatures}
            </>
        );
    }

    return (
        <>
            {highlightFeatures}
            {mailFeatures}
            {calendarFeatures}
            {driveFeatures}
            {vpnFeatures}
            {passFeatures}
            {walletFeatures}

            {lumoFeatures}
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
