import type { ReactNode } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { SkeletonLoader } from '@proton/atoms/SkeletonLoader/SkeletonLoader';
import CalendarLogo from '@proton/components/components/logo/CalendarLogo';
import DriveLogo from '@proton/components/components/logo/DriveLogo';
import MailLogo from '@proton/components/components/logo/MailLogo';
import PassLogo from '@proton/components/components/logo/PassLogo';
import VpnLogo from '@proton/components/components/logo/VpnLogo';
import CycleSelector from '@proton/components/containers/payments/CycleSelector';
import { getCalendarAppFeature } from '@proton/components/containers/payments/features/calendar';
import { getDriveAppFeature } from '@proton/components/containers/payments/features/drive';
import type { PlanCardFeatureDefinition } from '@proton/components/containers/payments/features/interface';
import {
    getMailAppFeature,
    getNAddressesFeature,
    getNDomainsFeatureText,
} from '@proton/components/containers/payments/features/mail';
import { getPassAppFeature } from '@proton/components/containers/payments/features/pass';
import {
    getCountries,
    getDoubleHop,
    getNetShield,
    getProtectDevices,
    getStreaming,
    getVPNAppFeature,
    getVPNSpeed,
} from '@proton/components/containers/payments/features/vpn';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import countriesIcon from '@proton/components/containers/payments/subscription/YourPlanSectionV2/icons/countries.svg';
import deviceIcon from '@proton/components/containers/payments/subscription/YourPlanSectionV2/icons/device.svg';
import doubleIcon from '@proton/components/containers/payments/subscription/YourPlanSectionV2/icons/double.svg';
import lightningIcon from '@proton/components/containers/payments/subscription/YourPlanSectionV2/icons/lightning.svg';
import shieldIcon from '@proton/components/containers/payments/subscription/YourPlanSectionV2/icons/shield.svg';
import streamingIcon from '@proton/components/containers/payments/subscription/YourPlanSectionV2/icons/streaming.svg';
import { getShortBillingText } from '@proton/components/containers/payments/subscription/helpers/getTotalBillingText';
import type { PaymentsCheckoutUI } from '@proton/payments/core/checkout';
import { CYCLE, PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import type { Currency, Cycle, PlanIDs } from '@proton/payments/core/interface';
import { getSimplePriceString } from '@proton/payments/core/price-format';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import { FREE_VPN_CONNECTIONS, VPN_CONNECTIONS } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import type { PlansMap } from '@proton/shared/lib/payments/plan/interface';
import { getFreeServers, getPlusServers } from '@proton/shared/lib/vpn/features';
import { VPN_SERVERS } from '@proton/shared/lib/vpn/vpnServers';
import clsx from '@proton/utils/clsx';

import { getSecureStorageString } from '../referral/helpers/i18n';
import SaveLabel2 from './SaveLabel2';
import { getPlanInformation } from './getPlanInformation';

type ThreePlansPlan = PLANS.FREE | PLANS.VPN2024 | PLANS.BUNDLE;

/** Paid plans show a colorful icon (`highResIcon`) or app logo (`logo`) next to each feature */
type ThreePlansFeature = PlanCardFeatureDefinition & { logo?: ReactNode };

const getCTA = (planName: string) => c('new_plans: action').t`Get ${planName}`;

const appLogoProps = { variant: 'glyph-only', size: 7, hasTitle: false } as const;

const getFeatures = (planName: ThreePlansPlan, plansMap: PlansMap): ThreePlansFeature[] => {
    if (planName === PLANS.FREE) {
        return [
            getCountries(getFreeServers(VPN_SERVERS.free.servers, VPN_SERVERS.free.countries)),
            getProtectDevices(FREE_VPN_CONNECTIONS),
        ];
    }

    if (planName === PLANS.VPN2024) {
        return [
            {
                ...getCountries(getPlusServers(VPN_SERVERS.paid.servers, VPN_SERVERS.paid.countries)),
                highResIcon: countriesIcon,
            },
            { ...getProtectDevices(VPN_CONNECTIONS), highResIcon: deviceIcon },
            { ...getVPNSpeed('highest'), highResIcon: lightningIcon },
            { ...getStreaming(true), highResIcon: streamingIcon },
            { ...getNetShield(true), highResIcon: shieldIcon },
            { ...getDoubleHop(true), highResIcon: doubleIcon },
        ];
    }

    const bundle = plansMap[PLANS.BUNDLE];
    const planOrAppName = PLAN_NAMES[PLANS.VPN2024];
    const mailSubtext = bundle
        ? `${getNAddressesFeature({ n: bundle.MaxAddresses }).text}, ${getNDomainsFeatureText(bundle.MaxDomains)}`
        : undefined;
    const storage = bundle ? humanSize({ bytes: bundle.MaxSpace, fraction: 0 }) : undefined;

    return [
        {
            ...getVPNAppFeature(),
            subtext: c('Info').t`Everything in ${planOrAppName}`,
            logo: <VpnLogo {...appLogoProps} />,
        },
        { ...getMailAppFeature(), subtext: mailSubtext, logo: <MailLogo {...appLogoProps} /> },
        {
            ...getDriveAppFeature(),
            subtext: storage ? getSecureStorageString(storage) : undefined,
            logo: <DriveLogo {...appLogoProps} />,
        },
        {
            ...getPassAppFeature(),
            subtext: c('new_plans: feature').t`Password manager`,
            logo: <PassLogo {...appLogoProps} />,
        },
        {
            ...getCalendarAppFeature(),
            subtext: c('vpn_signup_three_plans: Info').t`Premium calendar features`,
            logo: <CalendarLogo {...appLogoProps} />,
        },
    ];
};

const PlanCard = ({
    planName,
    title,
    logo,
    checkout,
    currency,
    cycle,
    recommended,
    selected,
    loading,
    disabled,
    features,
    onSelect,
}: {
    planName: ThreePlansPlan;
    title: string;
    logo: ReactNode;
    checkout: PaymentsCheckoutUI | undefined;
    currency: Currency;
    cycle: Cycle;
    recommended: boolean;
    selected: boolean;
    loading: boolean;
    disabled: boolean;
    features: ThreePlansFeature[];
    onSelect: () => void;
}) => {
    const isFree = planName === PLANS.FREE;
    const discountPerCycle = checkout?.discountPerCycle ?? 0;
    const hasDiscount = !isFree && discountPerCycle > 0;
    const monthlyPrice = isFree ? 0 : (checkout?.withDiscountPerMonth ?? 0);
    // Named like the variable of the existing "Save ${percentage}" translation, it holds the amount saved
    const percentage = getSimplePriceString(currency, discountPerCycle);

    const billedText = (() => {
        if (isFree) {
            return c('pass_signup_2023: Info').t`Free forever`;
        }
        if (!checkout) {
            return null;
        }
        if (cycle === CYCLE.MONTHLY) {
            return c('Billing cycle option').t`Billed monthly`;
        }
        const fullPrice = (
            <span className="text-strike" key="full-price">
                {getSimplePriceString(currency, checkout.withoutDiscountPerCycle)}
            </span>
        );
        const price = (
            <strong className="color-norm" key="price">
                {getSimplePriceString(currency, checkout.withDiscountPerCycle)}
            </strong>
        );
        // translator: shown after the full and discounted prices, for example "<s>239.76 €</s> 83.76 € for 24 months"
        const forCycle = c('vpn_signup_three_plans: Info').ngettext(
            msgid`for ${cycle} month`,
            `for ${cycle} months`,
            cycle
        );
        return (
            <>
                {fullPrice} {price} {forCycle}
            </>
        );
    })();

    return (
        <div
            className={clsx(
                'lg:flex-1 flex flex-column flex-nowrap *:min-size-auto rounded-xl border overflow-hidden',
                selected ? 'border-primary border-2' : 'border-weak',
                !recommended && 'lg:mt-8'
            )}
            data-testid={`three-plans-card-${planName}`}
        >
            {recommended && (
                <div className="bg-primary color-invert text-center text-sm text-semibold py-1 px-4">
                    {c('pass_signup_2023: Header').t`Recommended`}
                </div>
            )}
            <div className="p-6 flex flex-column flex-nowrap flex-1">
                <div className="flex justify-space-between items-start gap-2">
                    <div className="inline-block border rounded-lg p-2">{logo}</div>
                    {hasDiscount && !loading && (
                        <SaveLabel2 className="text-semibold text-uppercase px-2" highlightPrice>
                            {c('Info').t`Save ${percentage}`}
                        </SaveLabel2>
                    )}
                </div>
                <h3 className="text-xl text-bold mt-4" id={`${planName}-title`}>
                    {title}
                </h3>
                <div className="mt-4 flex items-baseline gap-1">
                    {loading ? (
                        <SkeletonLoader width="5em" height="2em" />
                    ) : (
                        <span className={clsx('text-4xl text-bold', hasDiscount && 'color-success')}>
                            {getSimplePriceString(currency, monthlyPrice)}
                        </span>
                    )}
                    <span className="color-weak">{c('Suffix').t`/month`}</span>
                </div>
                <div className="text-sm color-weak mt-1">{loading ? <SkeletonLoader width="10em" /> : billedText}</div>
                <Button
                    className="mt-6"
                    color={recommended ? 'norm' : 'weak'}
                    shape={recommended ? 'solid' : 'outline'}
                    fullWidth
                    disabled={disabled}
                    onClick={onSelect}
                    aria-describedby={`${planName}-title`}
                    data-testid={`three-plans-select-${planName}`}
                >
                    {getCTA(title)}
                </Button>
                {isFree ? (
                    <PlanCardFeatureList
                        features={features}
                        icon={false}
                        odd={false}
                        tooltip={false}
                        iconSize={5}
                        className="gap-3 mt-6"
                        margin={false}
                    />
                ) : (
                    <ul className="unstyled m-0 mt-6 flex flex-column gap-3">
                        {features.map(({ id, text, subtext, highResIcon, logo }) => (
                            <li
                                key={id}
                                className={clsx('flex flex-nowrap gap-3', subtext ? 'items-start' : 'items-center')}
                            >
                                <span className="shrink-0 flex">
                                    {logo ?? (highResIcon && <img src={highResIcon} width={24} height={24} alt="" />)}
                                </span>
                                <span className="flex-1 text-left">
                                    {text}
                                    {subtext && <span className="block text-sm color-weak">{subtext}</span>}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

interface Props {
    title: ReactNode;
    currencySelector: ReactNode;
    footer: ReactNode;
    plansMap: PlansMap;
    /** The checked price of a plan and cycle, or its optimistic price until it's checked */
    getCheckout: (planIDs: PlanIDs, cycle: Cycle) => { checkoutUi: PaymentsCheckoutUI; loading: boolean };
    selectedPlanName: string;
    cycle: Cycle;
    cycles: Cycle[];
    currency: Currency;
    loading: boolean;
    disabled: boolean;
    hideFreePlan: boolean;
    onChangeCycle: (cycle: Cycle) => void;
    onSelectPlan: (planName: PLANS.VPN2024 | PLANS.BUNDLE) => void;
    onSelectFree: () => void;
}

/**
 * Plan selection of the VpnSignupThreePlans experiment: Free, VPN Plus and Proton Unlimited cards
 * with a shared billing cycle.
 */
const ThreePlansSelector = ({
    title,
    currencySelector,
    footer,
    plansMap,
    getCheckout,
    selectedPlanName,
    cycle,
    cycles,
    currency,
    loading,
    disabled,
    hideFreePlan,
    onChangeCycle,
    onSelectPlan,
    onSelectFree,
}: Props) => {
    const getPlanCheckout = (planName: PLANS.VPN2024 | PLANS.BUNDLE, planCycle: Cycle) =>
        getCheckout({ [planName]: 1 }, planCycle);

    const cycleOptions = cycles.map((value) => {
        const text = getShortBillingText(value, {});
        const { checkoutUi, loading: loadingPrice } = getPlanCheckout(PLANS.VPN2024, value);
        const discountPercent = checkoutUi.discountPercent;
        return {
            text,
            value,
            element:
                discountPercent > 0 && !loadingPrice ? (
                    <>
                        {text}{' '}
                        <span className={clsx('text-semibold', value !== cycle && 'color-success')}>
                            (−{discountPercent}%)
                        </span>
                    </>
                ) : undefined,
        };
    });

    const plans = [!hideFreePlan && PLANS.FREE, PLANS.VPN2024, plansMap[PLANS.BUNDLE] && PLANS.BUNDLE].filter(
        (planName): planName is ThreePlansPlan => !!planName
    );

    return (
        <>
            <div className="flex flex-column lg:flex-row items-center justify-space-between gap-4">
                <h2 className="text-bold text-4xl">{title}</h2>
                <CycleSelector
                    mode="buttons"
                    cycle={cycle}
                    options={cycleOptions}
                    onSelect={(value) => onChangeCycle(value as Cycle)}
                    disabled={disabled}
                    size="small"
                    color="norm"
                    separators={false}
                    shape="ghost"
                    className="p-1"
                    pill
                />
                <div className="shrink-0">{currencySelector}</div>
            </div>
            <div className="mt-8 flex flex-column lg:flex-row lg:flex-nowrap gap-4">
                {plans.map((planName) => {
                    const plan = planName === PLANS.FREE ? FREE_PLAN : plansMap[planName];
                    const information = plan ? getPlanInformation({ loading, selectedPlan: plan }) : undefined;
                    if (!plan || !information) {
                        return null;
                    }
                    const isFree = planName === PLANS.FREE;
                    const price = isFree ? undefined : getPlanCheckout(planName, cycle);
                    return (
                        <PlanCard
                            key={planName}
                            planName={planName}
                            title={isFree ? c('Signup').t`Free` : plan.Title}
                            logo={information.logo}
                            checkout={price?.checkoutUi}
                            currency={currency}
                            cycle={cycle}
                            recommended={planName === PLANS.VPN2024}
                            selected={selectedPlanName === planName}
                            loading={price ? price.loading : loading}
                            disabled={disabled}
                            features={getFeatures(planName, plansMap)}
                            onSelect={isFree ? onSelectFree : () => onSelectPlan(planName)}
                        />
                    );
                })}
            </div>
            {footer}
        </>
    );
};

export default ThreePlansSelector;
