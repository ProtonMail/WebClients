import { type ReactNode, useRef, useState } from 'react';

import { c } from 'ttag';

import { usePlans } from '@proton/account/plans/hooks';
import {
    Button,
    DashboardCard,
    DashboardCardContent,
    DashboardCardImage,
    DashboardGrid,
    DashboardGridSectionHeader,
} from '@proton/atoms';
import DriveLogo from '@proton/components/components/logo/DriveLogo';
import MailLogo from '@proton/components/components/logo/MailLogo';
import PassLogo from '@proton/components/components/logo/PassLogo';
import VpnLogo from '@proton/components/components/logo/VpnLogo';
import usePopper from '@proton/components/components/popper/usePopper';
import Price from '@proton/components/components/price/Price';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import { IcChevronRight } from '@proton/icons';
import { CYCLE, PLANS, PLAN_NAMES, getPlanByName } from '@proton/payments';
import { getAppName } from '@proton/shared/lib/apps/helper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, BRAND_NAME, DASHBOARD_UPSELL_PATHS } from '@proton/shared/lib/constants';
import { getHasConsumerVpnPlan, getPricePerCycle } from '@proton/shared/lib/helpers/subscription';
import type { FreePlanDefault, PlansMap } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { getStorageFeature, getSyncAndBackupFeature, getVersionHistory } from '../../../features/drive';
import type { PlanCardFeatureDefinition } from '../../../features/interface';
import { getFoldersAndLabelsFeature, getNAddressesFeature, getNDomainsFeature } from '../../../features/mail';
import { PASS_PLUS_VAULTS, get2FAAuthenticator, getHideMyEmailAliases, getVaults } from '../../../features/pass';
import { PlanCardFeatureList } from '../../PlanCardFeatures';
import { useSubscriptionModal } from '../../SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../constants';
import type { GetPlanUpsellArgs, MaybeUpsell } from '../../helpers';
import { defaultUpsellCycleB2C, getUpsell } from '../../helpers';
import UpsellPanelsV2 from '../../panels/UpsellPanelsV2';
import { PlanIcon } from '../PlanIcon';
import PlanIconName from '../PlanIconName';
import type { UpsellSectionProps } from '../YourPlanUpsellsSectionV2';
import { getBillingCycleText, getDashboardUpsellTitle } from '../helpers';
import driveImage from '../images/drive.jpg';
import mailImage from '../images/mail.jpg';
import passImage from '../images/pass.jpg';
import vpnImage from '../images/vpn.jpg';
import UpsellMultiBox from './UpsellMultiBox';
import { useSubscriptionPriceComparison } from './helper';

const getBundleUpsell = ({ plansMap, openSubscriptionModal, app, ...rest }: GetPlanUpsellArgs): MaybeUpsell => {
    const plan = PLANS.BUNDLE;

    return getUpsell({
        plan,
        plansMap,
        features: [],
        app,
        upsellPath: DASHBOARD_UPSELL_PATHS.UNLIMITED,
        title: rest.title,
        customCycle: rest.customCycle || defaultUpsellCycleB2C,
        description: '',
        onUpgrade: () =>
            openSubscriptionModal({
                cycle: rest.customCycle || defaultUpsellCycleB2C,
                plan,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                disablePlanSelection: true,
                metrics: {
                    source: 'upsells',
                },
                telemetryFlow: rest.telemetryFlow,
            }),
        ...rest,
    });
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
            name: APPS.PROTONVPN_SETTINGS,
            logo: <VpnLogo />,
            text: () => c('Plan card').t`Your gateway to online freedom`,
            popoverImage: vpnImage,
            features: [
                {
                    text: c('Feature').t`Everything in ${PLAN_NAMES[PLANS.VPN2024]}`,
                    included: true,
                },
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
                className="UpsellMultiBox-product-cards m-0 rounded-lg w-full flex flex-column gap-1 p-4 cursor-pointer"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {card.logo}
                <span className="text-semibold">{card.text()}</span>
            </li>

            {isOpen && (
                <div
                    ref={floating}
                    style={{ ...position, ...arrow }}
                    className="UpsellMultiBox-popover rounded-lg shadow-lg bg-white p-4"
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
        <ul className="unstyled m-0 flex flex-column lg:flex-row flex-nowrap gap-4">
            {cards(plansMap, freePlan).map((card) => (
                <PopoverCard key={card.name} card={card} />
            ))}
        </ul>
    );
};

interface Props extends UpsellSectionProps {
    showProductCards?: boolean;
    showUpsellPanels: boolean;
    showDiscoverButton?: boolean;
    showUpsellHeader?: boolean;
    gridSectionHeaderCopy?: string;
}

const UnlimitedBannerGradient = ({
    showProductCards = false,
    showUpsellPanels = false,
    showDiscoverButton = true,
    showUpsellHeader = false,
    gridSectionHeaderCopy,
    subscription,
    app,
    plansMap,
    serversCount,
    freePlan,
    user,
    show24MonthPlan,
    ...rest
}: Props) => {
    const [openSubscriptionModal] = useSubscriptionModal();
    const [plansResult] = usePlans();
    const telemetryFlow = useDashboardPaymentFlow(app);

    const plan = PLANS.BUNDLE;
    const planName = PLAN_NAMES[plan];

    const handleExplorePlans = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            metrics: { source: 'upsells' },
            telemetryFlow,
        });
    };

    const handleCTAClick = (cycle: CYCLE, step: SUBSCRIPTION_STEPS) => {
        openSubscriptionModal({
            cycle: cycle,
            plan,
            step: step,
            disablePlanSelection: true,
            metrics: {
                source: 'upsells',
            },
            telemetryFlow,
        });
    };

    const upsellsPayload: GetPlanUpsellArgs = {
        app,
        plansMap,
        hasVPN: getHasConsumerVpnPlan(subscription),
        serversCount,
        freePlan,
        openSubscriptionModal,
        telemetryFlow,
        ...rest,
    };

    const upsells = [
        getBundleUpsell({
            ...upsellsPayload,
            customCycle: CYCLE.MONTHLY,
            highlightPrice: true,
            title: getDashboardUpsellTitle(CYCLE.MONTHLY),
        }),
        getBundleUpsell({
            ...upsellsPayload,
            customCycle: CYCLE.YEARLY,
            highlightPrice: true,
            title: getDashboardUpsellTitle(CYCLE.YEARLY),
            isRecommended: !show24MonthPlan,
        }),
        show24MonthPlan &&
            getBundleUpsell({
                ...upsellsPayload,
                customCycle: CYCLE.TWO_YEARS,
                highlightPrice: true,
                title: getDashboardUpsellTitle(CYCLE.TWO_YEARS),
                isRecommended: true,
            }),
    ].filter(isTruthy);

    const headerUpsellCycle = subscription?.Cycle || CYCLE.MONTHLY;

    const headerBottomLineCopy =
        showUpsellHeader && headerUpsellCycle ? (
            <span className="color-weak">{getBillingCycleText(headerUpsellCycle)}</span>
        ) : (
            c('Upsell').t`All premium ${BRAND_NAME} services, one easy subscription.`
        );

    const upsellHeader = () => {
        if (!subscription) {
            return;
        }

        const currency = (subscription && subscription.Currency) || user?.Currency || 'USD';

        const bundle = getPlanByName(plansResult?.plans ?? [], plan, currency);
        const planPricePerCycle = getPricePerCycle(bundle, headerUpsellCycle) ?? 0;

        const amount = planPricePerCycle / headerUpsellCycle;

        return (
            <div className="flex gap-3 items-center">
                <Price
                    currency={currency}
                    suffix={subscription && amount ? c('Suffix').t`/month` : ''}
                    wrapperClassName="text-semibold"
                    currencyClassName="text-5xl color-primary"
                    amountClassName="text-5xl color-primary"
                    data-testid="plan-price"
                >
                    {amount}
                </Price>
                <Button color="norm" onClick={() => handleCTAClick(headerUpsellCycle, SUBSCRIPTION_STEPS.CHECKOUT)}>
                    {c('Action').t`Upgrade`}
                </Button>
            </div>
        );
    };

    const { priceDifference } = useSubscriptionPriceComparison(subscription, plan);

    const priceString = getSimplePriceString(subscription.Currency, priceDifference);

    const sectionHeaderCopy = getBoldFormattedText(
        c('Headline').t`Unlock 4 more premium privacy services for just **${priceString}** more each month`,
        'color-primary'
    );

    return (
        <DashboardGrid>
            {showUpsellHeader || gridSectionHeaderCopy ? (
                <DashboardGridSectionHeader
                    title={showUpsellHeader ? sectionHeaderCopy : gridSectionHeaderCopy}
                    cta={
                        <Button color="norm" shape="ghost" onClick={handleExplorePlans}>
                            {c('Action').t`Compare all plans`}
                            <IcChevronRight className="shrink-0 ml-1" />
                        </Button>
                    }
                />
            ) : undefined}

            <UpsellMultiBox
                header={
                    <PlanIconName
                        logo={<PlanIcon planName={plan} />}
                        topLine={planName}
                        bottomLine={headerBottomLineCopy}
                    />
                }
                headerActionArea={
                    <>
                        {!showUpsellHeader && !showUpsellPanels && showDiscoverButton && (
                            <Button
                                color="weak"
                                shape="outline"
                                onClick={() => handleCTAClick(CYCLE.YEARLY, SUBSCRIPTION_STEPS.PLAN_SELECTION)}
                            >
                                {c('Action').t`Discover ${planName}`}
                            </Button>
                        )}
                        {showUpsellHeader && upsellHeader()}
                    </>
                }
                contentArea={showProductCards && <UnlimitedProductCards plansMap={plansMap} freePlan={freePlan} />}
                upsellPanels={
                    showUpsellPanels &&
                    subscription &&
                    upsells && (
                        <>
                            <div className="flex flex-column lg:flex-row gap-4 flex-nowrap">
                                <UpsellPanelsV2 upsells={upsells} subscription={subscription} />
                            </div>
                        </>
                    )
                }
                style="promotionGradient"
            />
        </DashboardGrid>
    );
};

export default UnlimitedBannerGradient;
