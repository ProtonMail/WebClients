import { type ReactNode, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { DashboardCard, DashboardCardContent, DashboardCardImage } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';
import Info from '@proton/components/components/link/Info';
import DriveLogo from '@proton/components/components/logo/DriveLogo';
import MailLogo from '@proton/components/components/logo/MailLogo';
import PassLogo from '@proton/components/components/logo/PassLogo';
import VpnLogo from '@proton/components/components/logo/VpnLogo';
import usePopper from '@proton/components/components/popper/usePopper';
import SubscriptionEndsBannerV2 from '@proton/components/containers/topBanners/SubscriptionEndsBannerV2';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import type { Currency, Cycle, FreePlanDefault, FullPlansMap, PlansMap } from '@proton/payments';
import { CYCLE, PLANS, PLAN_NAMES, type Subscription, getSubscriptionPlanTitle } from '@proton/payments';
import { usePayments } from '@proton/payments/ui/context/PaymentContext';
import { getPlanToCheck } from '@proton/payments/ui/context/helpers';
import { getAppName } from '@proton/shared/lib/apps/helper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, VPN_CONNECTIONS } from '@proton/shared/lib/constants';
import { everythingInPlanOrAppNameText, selectPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag';
import type { UserModel, VPNServersCountData } from '@proton/shared/lib/interfaces';
import { getSelectFromNCountries, getVpnDevices } from '@proton/shared/lib/vpn/features';

import { getStorageFeature, getSyncAndBackupFeature, getVersionHistory } from '../../../features/drive';
import type { PlanCardFeatureDefinition } from '../../../features/interface';
import { getFoldersAndLabelsFeature, getNAddressesFeature, getNDomainsFeature } from '../../../features/mail';
import { PASS_PLUS_VAULTS, get2FAAuthenticator, getHideMyEmailAliases, getVaults } from '../../../features/pass';
import { PlanCardFeatureList } from '../../PlanCardFeatures';
import { isUpsellWithPlan } from '../../helpers';
import UpsellPrice from '../../panels/components/UpsellPrice';
import { CycleSelector } from '../CycleSelector';
import { FreeVPNFeaturesB } from '../PlanFeatureSections';
import { PlanIcon } from '../PlanIcon';
import PlanIconName from '../PlanIconName';
import type { UpsellsHook } from '../YourPlanUpsellsSectionV2';
import { getBillingCycleText, getPlanTitlePlusMaybeBrand } from '../helpers';
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

interface SaveLabelProps {
    plan: PLANS | undefined;
    cycle: number | undefined;
    currency: Currency;
}

const SaveLabel = ({ plan, cycle, currency }: SaveLabelProps) => {
    const payments = usePayments();

    if (!plan || !cycle) {
        return null;
    }

    const price = payments.getPriceOrFallback(getPlanToCheck({ planIDs: { [plan]: 1 }, cycle, currency }));
    const discountPercent = price.checkoutUi.discountPercent;

    if (!discountPercent) {
        return null;
    }

    return (
        <span
            className="text-uppercase text-tabular-nums text-semibold text-xs rounded-sm py-0.5 px-1 fade-in"
            style={{
                backgroundColor: '#A2DDA1',
                color: '#144913',
            }}
        >
            {'-'}
            {discountPercent}
            {'%'}
        </span>
    );
};

const PlanNameSection = ({
    app,
    user,
    subscription,
}: {
    app: APP_NAMES;
    user: UserModel;
    subscription?: Subscription;
}) => {
    const { planTitle, planName } = getSubscriptionPlanTitle(user, subscription);

    const billingCycleElement = subscription?.Cycle && (
        <>
            <span className="color-weak mx-1">·</span>
            <span className="color-weak">{getBillingCycleText(subscription.Cycle)}</span>
        </>
    );

    const topLine = (
        <>
            <span>{getPlanTitlePlusMaybeBrand(planTitle, planName)}</span>
            <span className="text-normal">{billingCycleElement}</span>
        </>
    );

    return (
        <PlanIconName
            logo={<PlanIcon app={app} subscription={subscription} size={36} />}
            topLine={topLine}
            layout="vertical"
        />
    );
};

const PlanCard = ({
    cta,
    planNameSection,
    discountSection,
    priceSection,
    featureSection,
    gradientColor,
}: {
    cta: ReactNode;
    planNameSection: ReactNode;
    discountSection?: ReactNode;
    priceSection?: ReactNode;
    featureSection: ReactNode;
    gradientColor?: string;
}) => {
    const createGradient = (color?: string) =>
        gradientColor ? `linear-gradient(180deg, ${color} 0%, transparent 100%)` : 'transparent';

    return (
        <DashboardCard>
            <div className="p-3">
                <div
                    className="flex flex-row gap-1 justify-start rounded p-3 min-h-custom"
                    style={{
                        '--min-h-custom': '11.5rem',
                        background: createGradient(gradientColor),
                    }}
                >
                    <div className="flex justify-space-between items-start w-full">
                        {planNameSection}
                        {discountSection}
                    </div>
                    <div className="block w-full">{priceSection}</div>
                    <div className="mt-auto w-full">{cta}</div>
                </div>
                <div className="mt-3">{featureSection}</div>
            </div>
        </DashboardCard>
    );
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
            logo: <VpnLogo scale={0.66} />,
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
            logo: <MailLogo scale={0.66} />,
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
            logo: <DriveLogo scale={0.66} />,
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
            logo: <PassLogo scale={0.66} />,
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
                className="m-0 rounded border border-weak w-full flex flex-column gap-1 p-2 cursor-pointer interactive"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {card.logo}
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
        <>
            <h4 className="mt-0 mb-3 text-center text-lg text-semibold">{c('Features').t`4 more privacy services`}</h4>
            <ul className="unstyled m-0 flex flex-row gap-2">
                {cards(plansMap, freePlan).map((card) => (
                    <PopoverCard key={card.name} card={card} />
                ))}
            </ul>
        </>
    );
};

const getVPNFeatures = (vpnServers: VPNServersCountData): PlanCardFeatureDefinition[] => {
    const numberOfCountries = vpnServers.paid.countries;
    return [
        {
            text: getSelectFromNCountries(numberOfCountries),
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

const VPNPlanCard = ({
    vpnUpsells,
    serversCount,
    selectedCycle,
}: {
    vpnUpsells: UpsellsHook['upsells'];
    serversCount: VPNServersCountData;
    selectedCycle: Cycle;
}) => {
    const vpnUpsell = vpnUpsells.filter(isUpsellWithPlan).find((upsell) => upsell.customCycle === selectedCycle);

    if (!vpnUpsell || !vpnUpsell.price) {
        return null;
    }

    return (
        <PlanCard
            cta={
                <Button color="norm" onClick={() => vpnUpsell.onUpgrade(vpnUpsell.customCycle)} fullWidth>
                    {selectPlanOrAppNameText(PLAN_NAMES[PLANS.VPN2024])}
                </Button>
            }
            priceSection={<UpsellPrice upsell={vpnUpsell} />}
            planNameSection={
                <PlanIconName
                    logo={<PlanIcon planName={vpnUpsell.plan} size={36} />}
                    topLine={PLAN_NAMES[PLANS.VPN2024]}
                    layout="vertical"
                />
            }
            discountSection={
                <SaveLabel plan={vpnUpsell.plan} cycle={vpnUpsell.customCycle} currency={vpnUpsell.price.currency} />
            }
            featureSection={
                <ul className="unstyled px-2 flex flex-column text-semibold gap-3 m-0">
                    {getVPNFeatures(serversCount).map(({ text, tooltip, highResIcon }, index) => {
                        const key = typeof text === 'string' ? text : index;
                        return (
                            <li key={key} className="flex items-center flex-nowrap">
                                {highResIcon && <img src={highResIcon} alt="" className="shrink-0 mr-2" />}
                                {text}
                                {tooltip && <Info buttonClass="ml-2 align-middle" title={tooltip} />}
                            </li>
                        );
                    })}
                </ul>
            }
            gradientColor="rgba(1, 225, 183, 0.15)"
        />
    );
};

const BundlePlanCard = ({
    bundleUpsells,
    plansMap,
    freePlan,
    selectedCycle,
}: {
    bundleUpsells: UpsellsHook['upsells'];
    plansMap: FullPlansMap;
    freePlan: FreePlanDefault;
    selectedCycle: Cycle;
}) => {
    const bundleUpsell = bundleUpsells.filter(isUpsellWithPlan).find((upsell) => upsell.customCycle === selectedCycle);

    if (!bundleUpsell || !bundleUpsell.price) {
        return null;
    }

    return (
        <PlanCard
            cta={
                <Button color="norm" onClick={() => bundleUpsell.onUpgrade(bundleUpsell.customCycle)} fullWidth>
                    {selectPlanOrAppNameText(PLAN_NAMES[PLANS.BUNDLE])}
                </Button>
            }
            priceSection={<UpsellPrice upsell={bundleUpsell} />}
            planNameSection={
                <PlanIconName
                    logo={<PlanIcon planName={bundleUpsell.plan} size={36} />}
                    topLine={PLAN_NAMES[PLANS.BUNDLE]}
                    layout="vertical"
                />
            }
            discountSection={
                <SaveLabel
                    plan={bundleUpsell.plan}
                    cycle={bundleUpsell.customCycle}
                    currency={bundleUpsell.price.currency}
                />
            }
            featureSection={<UnlimitedProductCards plansMap={plansMap} freePlan={freePlan} />}
            gradientColor="rgba(109, 74, 255, 0.15)"
        />
    );
};

interface Props {
    subscription: Subscription;
    app: APP_NAMES;
    user: UserModel;
    serversCount: VPNServersCountData;
    plansMap: FullPlansMap;
    freePlan: FreePlanDefault;
    vpnUpsells: UpsellsHook['upsells'];
    bundleUpsells: UpsellsHook['upsells'];
    handleExplorePlans: () => void;
    telemetryFlow: UpsellsHook['telemetryFlow'];
    userCanHave24MonthPlan: boolean;
}

const CurrentPlanInfoWithUpsellSection = ({
    subscription,
    app,
    user,
    serversCount,
    plansMap,
    freePlan,
    vpnUpsells,
    bundleUpsells,
    userCanHave24MonthPlan,
    handleExplorePlans,
}: Props) => {
    const [selectedCycle, setSelectedCycle] = useState<Cycle>(CYCLE.MONTHLY);

    return (
        <>
            {/* Subscription ends banner needs to be here as we don't show the Your Plan section in this case */}
            <SubscriptionEndsBannerV2 app={app} />
            <DashboardGrid>
                <DashboardGridSectionHeader
                    title={c('Headline').t`Upgrade your privacy`}
                    center={
                        <CycleSelector
                            onSelect={(newCycle) => {
                                if (newCycle !== 'lifetime') {
                                    setSelectedCycle(newCycle);
                                }
                            }}
                            cycle={selectedCycle}
                            userCanHave24MonthPlan={userCanHave24MonthPlan}
                        />
                    }
                    cta={
                        <Button color="norm" shape="ghost" onClick={handleExplorePlans}>
                            {c('Action').t`Compare all plans`}
                            <IcChevronRight className="shrink-0 ml-1" />
                        </Button>
                    }
                    titleClassName="items-center"
                />
            </DashboardGrid>
            <DashboardGrid columns={3}>
                <PlanCard
                    cta={<Button disabled fullWidth>{c('Action').t`Current plan`}</Button>}
                    planNameSection={<PlanNameSection app={app} user={user} subscription={subscription} />}
                    featureSection={<FreeVPNFeaturesB serversCount={serversCount} />}
                />
                <VPNPlanCard vpnUpsells={vpnUpsells} serversCount={serversCount} selectedCycle={selectedCycle} />
                <BundlePlanCard
                    bundleUpsells={bundleUpsells}
                    plansMap={plansMap}
                    freePlan={freePlan}
                    selectedCycle={selectedCycle}
                />
            </DashboardGrid>
        </>
    );
};

export default CurrentPlanInfoWithUpsellSection;
