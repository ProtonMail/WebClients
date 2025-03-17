import { type ReactElement } from 'react';

import { c } from 'ttag';

import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import {
    Button,
    ButtonLike,
    DashboardCard,
    DashboardCardContent,
    DashboardCardImage,
    DashboardGrid,
    DashboardGridSection,
    DashboardGridSectionHeader,
} from '@proton/atoms/index';
import Loader from '@proton/components/components/loader/Loader';
import DriveLogo from '@proton/components/components/logo/DriveLogo';
import MailLogo from '@proton/components/components/logo/MailLogo';
import PassLogo from '@proton/components/components/logo/PassLogo';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useConfig from '@proton/components/hooks/useConfig';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import useLoad from '@proton/components/hooks/useLoad';
import { IcArrowRight } from '@proton/icons';
import { CYCLE, PLANS, PLAN_NAMES, getPlanByName, getPlansMap } from '@proton/payments';
import { getSubscriptionPlanTitleAndName } from '@proton/payments';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import {
    APPS,
    BRAND_NAME,
    DRIVE_APP_NAME,
    MAIL_APP_NAME,
    PASS_APP_NAME,
    VPN_APP_NAME,
} from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { getPricePerCycle } from '@proton/shared/lib/helpers/subscription';
import { getPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag';
import type { FreePlanDefault } from '@proton/shared/lib/interfaces';
import { type Plan } from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import { getSpace } from '@proton/shared/lib/user/storage';

import ProductLink from '../../app/ProductLink';
import { PromotionBanner } from '../../banner/PromotionBanner';
import { getDocumentEditor, getStorageFeature, getVersionHistory } from '../../payments/features/drive';
import { type PlanCardFeatureDefinition } from '../../payments/features/interface';
import { getDarkWebMonitoringFeature, getNAddressesFeature, getNDomainsFeature } from '../../payments/features/mail';
import {
    PASS_PLUS_VAULT_SHARING,
    get2FAAuthenticator,
    getLoginsAndNotes,
    getVaultSharing,
} from '../../payments/features/pass';
import { PlanCardFeatureList } from '../../payments/subscription/PlanCardFeatures';
import { useSubscriptionModal } from '../../payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../payments/subscription/constants';
import bundleLogo from './illustrations/bundle.svg';
import drive from './illustrations/drive.jpg';
import mail from './illustrations/mail.jpg';
import pass from './illustrations/pass.jpg';

interface Card {
    app: APP_NAMES;
    copy?: () => string;
    features?: PlanCardFeatureDefinition[];
    buttonCopy: () => string;
    image: string;
    logo: ReactElement;
    shouldRender: (planName: string) => boolean;
}

const freeAndPlusPlans = [PLANS.FREE, PLANS.MAIL, PLANS.DRIVE, PLANS.PASS, PLANS.VPN, PLANS.VPN2024];
const plusPlans = [PLANS.MAIL, PLANS.DRIVE, PLANS.PASS, PLANS.VPN, PLANS.VPN2024];
const vpnPlans = [PLANS.VPN, PLANS.VPN2024];
const bundlePlans = [PLANS.BUNDLE, PLANS.FAMILY, PLANS.DUO, PLANS.VISIONARY];

interface CardProps {
    plan: Plan | undefined;
    space: {
        usedSpace: number;
        usedBaseSpace: number;
        usedDriveSpace: number;
        maxSpace: number;
        maxBaseSpace: number;
        maxDriveSpace: number;
        splitStorage: boolean;
    };
    freePlan: FreePlanDefault;
}

const cards = ({ plan, space, freePlan }: CardProps): Card[] => {
    const maxDriveSpace = humanSize({ bytes: space.maxDriveSpace, unit: 'GB', fraction: 0 });

    return [
        {
            app: APPS.PROTONMAIL,
            copy: () => c('VPN Dashboard').t`Communicate and schedule with end-to-end encryption.`,
            image: mail,
            buttonCopy: () => getPlanOrAppNameText(MAIL_APP_NAME),
            logo: <MailLogo />,
            shouldRender: (planName: string) => planName !== PLANS.MAIL && freeAndPlusPlans.includes(planName as PLANS),
        },
        {
            app: APPS.PROTONMAIL,
            image: mail,
            buttonCopy: () => getPlanOrAppNameText(MAIL_APP_NAME),
            logo: <MailLogo />,
            features: [
                getNAddressesFeature({ n: plan?.MaxAddresses || 0 }),
                getNDomainsFeature({ n: plan?.MaxDomains || 0 }),
                getDarkWebMonitoringFeature(),
            ],
            shouldRender: (planName: string) => bundlePlans.includes(planName as PLANS),
        },
        {
            app: APPS.PROTONDRIVE,
            copy: () =>
                c('VPN Dashboard')
                    .t`Keep your files, photos, and documents safe with ${maxDriveSpace} free cloud storage.`,
            image: drive,
            buttonCopy: () => getPlanOrAppNameText(DRIVE_APP_NAME),
            logo: <DriveLogo />,
            shouldRender: (planName: string) =>
                planName !== PLANS.DRIVE && freeAndPlusPlans.includes(planName as PLANS),
        },
        {
            app: APPS.PROTONDRIVE,
            image: drive,
            buttonCopy: () => getPlanOrAppNameText(DRIVE_APP_NAME),
            logo: <DriveLogo />,
            features: [
                getStorageFeature(space.maxSpace, {
                    freePlan,
                    family: plan?.Name === PLANS.FAMILY,
                    duo: plan?.Name === PLANS.DUO,
                    visionary: plan?.Name === PLANS.VISIONARY,
                }),
                getDocumentEditor(),
                getVersionHistory(),
            ],
            shouldRender: (planName: string) => bundlePlans.includes(planName as PLANS),
        },
        {
            app: APPS.PROTONPASS,
            copy: () => c('VPN Dashboard').t`Set secure passwords without the hassle.`,
            image: pass,
            buttonCopy: () => getPlanOrAppNameText(PASS_APP_NAME),
            logo: <PassLogo />,
            shouldRender: (planName: string) => planName !== PLANS.PASS && freeAndPlusPlans.includes(planName as PLANS),
        },
        {
            app: APPS.PROTONPASS,
            image: pass,
            buttonCopy: () => getPlanOrAppNameText(PASS_APP_NAME),
            logo: <PassLogo />,
            features: [getLoginsAndNotes('paid'), getVaultSharing(PASS_PLUS_VAULT_SHARING), get2FAAuthenticator(true)],
            shouldRender: (planName: string) => bundlePlans.includes(planName as PLANS),
        },
    ];
};

export const VpnAlsoInYourPlanSection = ({ app }: { app: APP_NAMES }) => {
    const [user] = useUser();
    const { APP_NAME } = useConfig();
    const [subscription, loadingSubscription] = useSubscription();
    const [openSubscriptionModal] = useSubscriptionModal();
    const plan = PLANS.BUNDLE;
    const telemetryFlow = useDashboardPaymentFlow(app);

    useLoad();

    const [plansResult, loadingPlans] = usePlans();
    const plans = plansResult?.plans;
    const freePlan = plansResult?.freePlan || FREE_PLAN;

    let space = getSpace(user);

    const { planTitle, planName } = getSubscriptionPlanTitleAndName(user, subscription);
    const loading = loadingSubscription || loadingPlans;

    if (!subscription || !plans || loading || !planName) {
        return <Loader />;
    }

    const currency = subscription.Currency || user?.Currency || 'USD';

    const plansMap = getPlansMap(plans, subscription.Currency, false);
    const bundle = getPlanByName(plansResult?.plans ?? [], plan, currency);
    const planPricePerCycle = getPricePerCycle(bundle, CYCLE.YEARLY) ?? 0;

    const priceString = bundle ? getSimplePriceString(currency, planPricePerCycle / CYCLE.YEARLY) : undefined;

    const sectionSubtitleCopy = () => {
        const planTitlePlusMaybeBrand = planName === PLANS.FREE ? `${BRAND_NAME} ${planTitle}` : planTitle;

        if (plusPlans.includes(planName) && !vpnPlans.includes(planName)) {
            return c('VPN Dashboard')
                .t`With ${planTitlePlusMaybeBrand}, you get free access to ${VPN_APP_NAME} and other privacy services.`;
        }

        if (freeAndPlusPlans.includes(planName)) {
            return c('VPN Dashboard')
                .t`With ${planTitlePlusMaybeBrand}, you get free access to all ${BRAND_NAME} privacy services.`;
        }

        if (bundlePlans.includes(planName)) {
            // Translator: Examples: "Get more from your Visionary subscription", "Get more from your Duo subscription"
            return c('VPN Dashboard').t`Get more from your ${planTitle} subscription.`;
        }
    };

    const filteredCards = cards({ plan: planName ? plansMap[planName] : freePlan, space, freePlan }).filter((card) =>
        card.shouldRender(planName)
    );

    const showUnlimitedUpsell = freeAndPlusPlans.includes(planName);

    if (filteredCards.length === 0) {
        return false;
    }

    const handleGetPlan = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            plan: plan,
            metrics: { source: 'upsells' },
            telemetryFlow,
        });
    };

    return (
        <>
            <DashboardGrid columns={filteredCards.length}>
                <DashboardGridSection spanAll="header">
                    <DashboardGridSectionHeader
                        title={c('Title').t`Also in your plan`}
                        subtitle={sectionSubtitleCopy()}
                    />
                </DashboardGridSection>
                {filteredCards.map((card) => (
                    <DashboardGridSection key={card.app}>
                        <DashboardCard className="flex flex-column">
                            <DashboardCardImage>
                                <img src={card.image} alt="" className="w-full" />
                            </DashboardCardImage>
                            <DashboardCardContent className="flex flex-column gap-2 grow">
                                <div className="block">{card.logo}</div>
                                {card.copy && <p className="m-0">{card.copy()}</p>}
                                {card.features && (
                                    <PlanCardFeatureList
                                        features={card.features}
                                        icon
                                        odd={false}
                                        margin={false}
                                        className="gap-2"
                                    />
                                )}
                                <footer className="mt-auto pt-2">
                                    <ButtonLike
                                        as={ProductLink}
                                        ownerApp={APP_NAME}
                                        appToLinkTo={card.app}
                                        app={app}
                                        user={user}
                                        fullWidth
                                        shape="solid"
                                        color="weak"
                                        className="flex items-center justify-center gap-2"
                                    >
                                        {card.buttonCopy()}
                                        <IcArrowRight className="shrink-0" />
                                    </ButtonLike>
                                </footer>
                            </DashboardCardContent>
                        </DashboardCard>
                    </DashboardGridSection>
                ))}
                {showUnlimitedUpsell ? (
                    <DashboardGridSection spanAll="footer">
                        <PromotionBanner
                            rounded="lg"
                            mode="banner"
                            gradient="vertical"
                            contentCentered={false}
                            description={
                                <div className="flex items-center gap-3 p-1">
                                    <div className="flex shrink-0 items-center justify-center rounded-lg bg-norm p-2 flex-column md:flex-row flex-nowrap text-left">
                                        <img src={bundleLogo} alt="" className="w-12 ratio-square" />
                                    </div>
                                    <div className="text-left">
                                        <b className="color-hint text-sm text-semibold">{c('Info').t`Did you know?`}</b>
                                        <p className="m-0 text-lg color-norm">
                                            {priceString &&
                                                getBoldFormattedText(
                                                    c('Info')
                                                        .t`You can get all of our premium privacy services in one bundle—and it’s just **${priceString}/month**.`
                                                )}
                                        </p>
                                    </div>
                                </div>
                            }
                            cta={
                                <Button
                                    color="norm"
                                    shape="ghost"
                                    className="flex items-center gap-1 flex-nowrap"
                                    onClick={handleGetPlan}
                                >
                                    {c('Action').t`Explore ${PLAN_NAMES[plan]}`}
                                    <IcArrowRight className="shrink-0" />
                                </Button>
                            }
                        />
                    </DashboardGridSection>
                ) : undefined}
            </DashboardGrid>
        </>
    );
};

export default VpnAlsoInYourPlanSection;
