import { type ReactNode, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { usePlans } from '@proton/account/plans/hooks';
import {
    Button,
    DashboardCard,
    DashboardCardContent,
    DashboardCardImage,
    DashboardGrid,
    DashboardGridSectionHeader,
} from '@proton/atoms';
import Info from '@proton/components/components/link/Info';
import DriveLogo from '@proton/components/components/logo/DriveLogo';
import MailLogo from '@proton/components/components/logo/MailLogo';
import PassLogo from '@proton/components/components/logo/PassLogo';
import VpnLogo from '@proton/components/components/logo/VpnLogo';
import usePopper from '@proton/components/components/popper/usePopper';
import Price from '@proton/components/components/price/Price';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import { IcChevronRight } from '@proton/icons';
import type { Currency, FullPlansMap } from '@proton/payments';
import {
    CYCLE,
    type Cycle,
    type FreePlanDefault,
    PLANS,
    PLAN_NAMES,
    type PlansMap,
    getPlanByName,
    getPricePerCycle,
    getPricingFromPlanIDs,
    getSubscriptionPlanTitleAndName,
    getTotalFromPricing,
} from '@proton/payments';
import { getAppName } from '@proton/shared/lib/apps/helper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, BRAND_NAME, VPN_CONNECTIONS } from '@proton/shared/lib/constants';
import { everythingInPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag';
import type { VPNServersCountData } from '@proton/shared/lib/interfaces';
import { getSelectFromNCountries, getVpnDevices } from '@proton/shared/lib/vpn/features';
import isTruthy from '@proton/utils/isTruthy';

import CycleSelector from '../../../CycleSelector';
import { getStorageFeature, getSyncAndBackupFeature, getVersionHistory } from '../../../features/drive';
import type { PlanCardFeatureDefinition } from '../../../features/interface';
import { getFoldersAndLabelsFeature, getNAddressesFeature, getNDomainsFeature } from '../../../features/mail';
import { PASS_PLUS_VAULTS, get2FAAuthenticator, getHideMyEmailAliases, getVaults } from '../../../features/pass';
import { PlanCardFeatureList } from '../../PlanCardFeatures';
import { useSubscriptionModal } from '../../SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../constants';
import { FreeVPNFeaturesB } from '../PlanFeatureSections';
import { PlanIcon } from '../PlanIcon';
import PlanIconName from '../PlanIconName';
import type { UpsellSectionProps } from '../YourPlanUpsellsSectionV2';
import { getPlanTitlePlusMaybeBrand } from '../helpers';
import countriesIcon from '../icons/countries.svg';
import deviceIcon from '../icons/device.svg';
import doubleIcon from '../icons/double.svg';
import lightningIcon from '../icons/lightning.svg';
import shieldIcon from '../icons/shield.svg';
import streamingIcon from '../icons/streaming.svg';
import driveImage from '../images/drive.jpg';
import mailImage from '../images/mail.jpg';
import passImage from '../images/pass.jpg';
import vpnImage from '../images/vpn.jpg';

const getVPNFeatures = (vpnServers: VPNServersCountData): PlanCardFeatureDefinition[] => {
    return [
        {
            text: getSelectFromNCountries(vpnServers.paid.countries),
            included: true,
            highResIcon: countriesIcon,
        },
        {
            text: getVpnDevices(VPN_CONNECTIONS),
            included: true,
            highResIcon: deviceIcon,
        },
        {
            text: c('Features').t`Lightning-fast VPN speeds`,
            included: true,
            highResIcon: lightningIcon,
        },
        {
            text: c('Features').t`Stream from Netflix, HBO, and more`,
            included: true,
            highResIcon: streamingIcon,
        },
        {
            text: c('Features').t`Ad-blocker and malware protection`,
            included: true,
            highResIcon: shieldIcon,
        },
        {
            text: c('Features').t`Double VPN`,
            included: true,
            highResIcon: doubleIcon,
        },
    ];
};

interface CardProps {
    name: APP_NAMES;
    logo: ReactNode;
    text: () => string;
    popoverImage: string;
    features: PlanCardFeatureDefinition[];
}

const cards = (plansMap: PlansMap, freePlan: FreePlanDefault): CardProps[] => {
    const plan = PLANS.BUNDLE;

    return [
        {
            name: APPS.PROTONVPN_SETTINGS,
            logo: <VpnLogo />,
            text: () => c('Plan card').t`Your gateway to online freedom`,
            popoverImage: vpnImage,
            features: [
                {
                    text: everythingInPlanOrAppNameText(PLAN_NAMES[PLANS.VPN2024]),
                    included: true,
                },
            ],
        },
        {
            name: APPS.PROTONMAIL,
            logo: <MailLogo />,
            text: () => c('Plan card').t`Secure email that protects your privacy`,
            popoverImage: mailImage,
            features: [
                getNAddressesFeature({ n: plansMap[plan]?.MaxAddresses || 15 }),
                getNDomainsFeature({ n: plansMap[plan]?.MaxDomains || 0 }),
                getFoldersAndLabelsFeature('unlimited'),
            ],
        },
        {
            name: APPS.PROTONDRIVE,
            logo: <DriveLogo />,
            text: () => c('Plan card').t`Encrypted cloud storage for photos and files`,
            popoverImage: driveImage,
            features: [
                getStorageFeature(plansMap[plan]?.MaxSpace ?? 536870912000, { subtext: true, freePlan }),
                getSyncAndBackupFeature(),
                getVersionHistory(),
            ],
        },
        {
            name: APPS.PROTONPASS,
            logo: <PassLogo />,
            text: () => c('Plan card').t`Password manager with identity protection`,
            popoverImage: passImage,
            features: [getVaults(PASS_PLUS_VAULTS), getHideMyEmailAliases('unlimited'), get2FAAuthenticator(true)],
        },
    ];
};

const PopoverCard = ({ card }: { card: CardProps }) => {
    const [isOpen, setIsOpen] = useState(false);
    const anchorRef = useRef<HTMLLIElement>(null);
    const { floating, position, arrow } = usePopper({
        reference: {
            mode: 'element',
            value: anchorRef.current,
        },
        isOpen,
        originalPlacement: 'top',
        availablePlacements: ['top', 'bottom'],
        offset: -10,
    });

    const handleMouseEnter = () => setIsOpen(true);
    const handleMouseLeave = () => setIsOpen(false);

    return (
        <>
            <li
                ref={anchorRef}
                className="UpsellMultiBox-product-cards m-0 rounded border border-weak w-full flex flex-column gap-1 p-3 cursor-pointer"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <span style={{ scale: '0.8', transformOrigin: 'left', marginBlock: '-0.3rem' }}>{card.logo}</span>
                <span className="color-weak text-sm">{card.text()}</span>
            </li>

            {isOpen && (
                <div
                    ref={floating}
                    style={{ ...position, ...arrow }}
                    className="UpsellMultiBox-popover rounded-lg shadow-lg bg-white p-4 pointer-events-none"
                >
                    <DashboardCard rounded="lg" className="shadow-lifted">
                        <DashboardCardImage>
                            <img
                                src={card.popoverImage}
                                alt=""
                                className="w-custom h-custom"
                                style={{ '--w-custom': '400px', '--h-custom': '225px', aspectRatio: '400/225' }}
                            />
                        </DashboardCardImage>
                        <DashboardCardContent>
                            <>
                                <h4 className="mt-0 mb-3 text-2xl text-semibold">{getAppName(card.name)}</h4>
                                <PlanCardFeatureList
                                    features={card.features}
                                    tooltip={false}
                                    odd={false}
                                    margin={false}
                                    className="gap-2"
                                />
                            </>
                        </DashboardCardContent>
                    </DashboardCard>
                </div>
            )}
        </>
    );
};

const UnlimitedProductCards = ({ plansMap, freePlan }: { plansMap: PlansMap; freePlan: FreePlanDefault }) => {
    return (
        <ul className="unstyled m-0 flex flex-column gap-3">
            {cards(plansMap, freePlan).map((card) => (
                <PopoverCard key={card.name} card={card} />
            ))}
        </ul>
    );
};

const CustomSaveLabel = ({ children }: { children: ReactNode }) => {
    return (
        <span
            className="inline-block px-1 text-sm rounded-sm text-semibold"
            style={{ backgroundColor: '#A2DDA1', color: '#144913' }}
        >
            {children}
        </span>
    );
};

const getSaveLabel = (plan: PLANS | undefined, cycle: CYCLE | undefined, plansMap: FullPlansMap) => {
    if (!plan || !cycle) {
        return;
    }

    const pricing = getPricingFromPlanIDs({ [plan]: 1 }, plansMap);
    const totals = getTotalFromPricing(pricing, cycle);
    const discountPercent = totals.discountPercentage;

    if (!discountPercent) {
        return;
    }

    return (
        <CustomSaveLabel>
            {'-'}
            {discountPercent}
            {'%'}
        </CustomSaveLabel>
    );
};

const CurrentPlan = ({ app, subscription, user, serversCount }: UpsellSectionProps) => {
    const { planTitle, planName } = getSubscriptionPlanTitleAndName(user, subscription);

    return (
        <DashboardCard>
            <div className="p-3">
                <div className="p-3 flex flex-column gap-4">
                    <header className="min-h-custom flex flex-column" style={{ '--min-h-custom': '8rem' }}>
                        <PlanIconName
                            layout="vertical"
                            logo={<PlanIcon app={app} subscription={subscription} />}
                            topLine={getPlanTitlePlusMaybeBrand(planTitle, planName)}
                            className="mb-2"
                        />
                    </header>
                    <Button disabled fullWidth>{c('Info').t`Current plan`}</Button>
                    <FreeVPNFeaturesB serversCount={serversCount} isFreeUser={user.isFree} />
                </div>
            </div>
        </DashboardCard>
    );
};

interface PlansProps {
    plansMap: FullPlansMap;
    serversCount: VPNServersCountData;
    cycle: CYCLE;
    currency: Currency;
    freePlan: FreePlanDefault;
    handlePlanSelection: (plan: PLANS, cycle: CYCLE) => void;
}

const VPNPlus = ({ plansMap, serversCount, cycle, currency, handlePlanSelection }: PlansProps) => {
    const [plansResult] = usePlans();
    const plan = PLANS.VPN2024;

    const fullPlan = getPlanByName(plansResult?.plans ?? [], plan, currency);
    const planPricePerCycle = getPricePerCycle(fullPlan, cycle) ?? 0;

    const amount = planPricePerCycle / cycle;

    return (
        <DashboardCard>
            <div className="p-3">
                <div className="UpsellMultiBox-gradient-vpn rounded-lg flex flex-column gap-4 p-3">
                    <header className="min-h-custom flex flex-column" style={{ '--min-h-custom': '8rem' }}>
                        <div className="flex justify-space-between items-start mb-2">
                            <PlanIconName
                                layout="vertical"
                                logo={<PlanIcon planName={plan} />}
                                topLine={PLAN_NAMES[plan]}
                            />
                            {getSaveLabel(plan, cycle, plansMap)}
                        </div>
                        <Price
                            key="plan-price"
                            currencyClassName="text-5xl color-primary text-semibold"
                            amountClassName="text-5xl color-primary text-semibold"
                            suffixClassName="color-norm"
                            currency={currency}
                            suffix={c('new_plans: Plan frequency').t`/month`}
                        >
                            {amount}
                        </Price>
                    </header>
                    <Button color="norm" fullWidth onClick={() => handlePlanSelection(plan, cycle)}>{c('Info')
                        .t`Select ${PLAN_NAMES[plan]}`}</Button>
                </div>
                <div className="flex flex-column gap-4 p-3">
                    <ul className="unstyled m-0 flex flex-column gap-3">
                        {getVPNFeatures(serversCount).map(({ text, tooltip, highResIcon }, index) => {
                            const key = typeof text === 'string' ? text : index;
                            return (
                                <li key={key} className="flex items-center text-semibold">
                                    {highResIcon && <img src={highResIcon} alt="" className="shrink-0 mr-2" />}
                                    {text}
                                    {tooltip && <Info buttonClass="ml-2 align-middle" title={tooltip} />}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </DashboardCard>
    );
};

const Unlimited = ({ plansMap, cycle, currency, freePlan, handlePlanSelection }: PlansProps) => {
    const [plansResult] = usePlans();
    const plan = PLANS.BUNDLE;

    const fullPlan = getPlanByName(plansResult?.plans ?? [], plan, currency);
    const planPricePerCycle = getPricePerCycle(fullPlan, cycle) ?? 0;

    const amount = planPricePerCycle / cycle;

    return (
        <DashboardCard>
            <div className="p-3">
                <div className="UpsellMultiBox-gradient-unlimited-to-white rounded-lg flex flex-column gap-4 p-3">
                    <header className="min-h-custom flex flex-column" style={{ '--min-h-custom': '8rem' }}>
                        <div className="flex justify-space-between items-start mb-2">
                            <PlanIconName
                                layout="vertical"
                                logo={<PlanIcon planName={plan} />}
                                topLine={PLAN_NAMES[plan]}
                            />
                            {getSaveLabel(plan, cycle, plansMap)}
                        </div>
                        <Price
                            key="plan-price"
                            currencyClassName="text-5xl color-primary text-semibold"
                            amountClassName="text-5xl color-primary text-semibold"
                            suffixClassName="color-norm"
                            currency={currency}
                            suffix={c('new_plans: Plan frequency').t`/month`}
                        >
                            {amount}
                        </Price>
                    </header>
                    <Button color="norm" fullWidth onClick={() => handlePlanSelection(plan, cycle)}>{c('Info')
                        .t`Select ${PLAN_NAMES[plan]}`}</Button>
                </div>
                <div className="flex flex-column gap-4">
                    <h4 className="text-rg text-semibold text-center">{c('Title')
                        .t`All premium ${BRAND_NAME} services`}</h4>
                    <UnlimitedProductCards plansMap={plansMap} freePlan={freePlan} />
                </div>
            </div>
        </DashboardCard>
    );
};

const VpnPlusUnlimitedCombo = ({
    subscription,
    app,
    plansMap,
    serversCount,
    freePlan,
    user,
    show24MonthPlan,
}: UpsellSectionProps) => {
    const [openSubscriptionModal] = useSubscriptionModal();
    const telemetryFlow = useDashboardPaymentFlow(app);
    const [cycle, setCycle] = useState(CYCLE.YEARLY);

    const handleExplorePlans = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            metrics: { source: 'upsells' },
            telemetryFlow,
        });
    };

    const handlePlanSelection = (plan: PLANS, cycle: CYCLE) => {
        openSubscriptionModal({
            cycle,
            plan,
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            disablePlanSelection: true,
            metrics: {
                source: 'upsells',
            },
            telemetryFlow,
        });
    };

    const getMonths = (n: number) => c('vpn_2step: info').ngettext(msgid`${n} month`, `${n} months`, n);

    const currency = (subscription && subscription.Currency) || user?.Currency || 'USD';

    return (
        <DashboardGrid>
            <DashboardGridSectionHeader
                title={c('Headline').t`Upgrade your privacy`}
                center={
                    <CycleSelector
                        mode="buttons"
                        cycle={cycle}
                        onSelect={(cycle) => setCycle(cycle as Cycle)}
                        options={[
                            { text: getMonths(1), value: CYCLE.MONTHLY },
                            { text: getMonths(12), value: CYCLE.YEARLY },
                            show24MonthPlan ? { text: getMonths(24), value: CYCLE.TWO_YEARS } : undefined,
                        ].filter(isTruthy)}
                        size="small"
                    />
                }
                cta={
                    <Button color="norm" shape="ghost" onClick={handleExplorePlans}>
                        {c('Action').t`Compare all plans`}
                        <IcChevronRight className="shrink-0 ml-1" />
                    </Button>
                }
            />

            <div className="flex flex-column xl:grid xl:grid-cols-3 gap-4">
                <CurrentPlan
                    user={user}
                    subscription={subscription}
                    serversCount={serversCount}
                    app={app}
                    plansMap={plansMap}
                    freePlan={freePlan}
                    show24MonthPlan={show24MonthPlan}
                />
                <VPNPlus
                    plansMap={plansMap}
                    serversCount={serversCount}
                    cycle={cycle}
                    currency={currency}
                    freePlan={freePlan}
                    handlePlanSelection={handlePlanSelection}
                />
                <Unlimited
                    plansMap={plansMap}
                    serversCount={serversCount}
                    cycle={cycle}
                    currency={currency}
                    freePlan={freePlan}
                    handlePlanSelection={handlePlanSelection}
                />
            </div>
        </DashboardGrid>
    );
};

export default VpnPlusUnlimitedCombo;
