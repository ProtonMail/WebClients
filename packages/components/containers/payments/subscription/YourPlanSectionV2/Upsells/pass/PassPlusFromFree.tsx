import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { IcAlias } from '@proton/icons/icons/IcAlias';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { IcPaperClip } from '@proton/icons/icons/IcPaperClip';
import { IcQrCode } from '@proton/icons/icons/IcQrCode';
import { IcShield2Bolt } from '@proton/icons/icons/IcShield2Bolt';
import { IcUsers } from '@proton/icons/icons/IcUsers';
import { IcVault } from '@proton/icons/icons/IcVault';
import { CYCLE, PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { DARK_WEB_MONITORING_NAME, DASHBOARD_UPSELL_PATHS } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import Info from '../../../../../../components/link/Info';
import useDashboardPaymentFlow from '../../../../../../hooks/useDashboardPaymentFlow';
import type { PlanCardFeatureDefinition } from '../../../../features/interface';
import { get2FAAuthenticatorText, getNVaultsText, getUnlimitedHideMyEmailAliasesText } from '../../../../features/pass';
import { useSubscriptionModal } from '../../../SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../../constants';
import type { GetPlanUpsellArgs } from '../../../helpers/dashboard-upsells';
import UpsellPanelsV2 from '../../../panels/UpsellPanelsV2';
import { PlanIcon } from '../../PlanIcon';
import PlanIconName from '../../PlanIconName';
import type { UpsellSectionProps, UpsellsHook } from '../../YourPlanUpsellsSectionV2';
import { getDashboardUpsellTitle } from '../../helpers';
import UpsellMultiBox from '../UpsellMultiBox';
import { getDashboardUpsellV2 } from '../helper';

const getPassFeatures = (): PlanCardFeatureDefinition[] => {
    return [
        {
            id: 'vaults',
            text: getNVaultsText('unlimited'),
            included: true,
            icon: IcVault,
        },
        {
            id: 'secure-sharing',
            text: c('Features').t`Secure vault, item, and link sharing`,
            included: true,
            icon: IcUsers,
        },
        {
            id: 'hide-my-email-aliases',
            text: getUnlimitedHideMyEmailAliasesText(),
            included: true,
            icon: IcAlias,
        },
        {
            id: '2fa-authenticator',
            text: get2FAAuthenticatorText(),
            included: true,
            icon: IcQrCode,
        },
        {
            id: 'file-attachments',
            text: c('Features').t`File attachment `,
            included: true,
            icon: IcPaperClip,
        },
        {
            id: 'dark-web-monitoring',
            text: DARK_WEB_MONITORING_NAME,
            included: true,
            icon: IcShield2Bolt,
        },
    ];
};

export const usePassPlusFromFreeUpsells = ({ app, plansMap, freePlan, user }: UpsellSectionProps): UpsellsHook => {
    const [openSubscriptionModal] = useSubscriptionModal();
    const telemetryFlow = useDashboardPaymentFlow(app);

    const upsellsPayload: GetPlanUpsellArgs = {
        app,
        plansMap,
        freePlan,
        openSubscriptionModal,
        telemetryFlow,
    };

    const handleExplorePlans = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            telemetryFlow,
        });
    };

    const upsells = [
        getDashboardUpsellV2({
            ...upsellsPayload,
            upsellPath: DASHBOARD_UPSELL_PATHS.PASS,
            plan: PLANS.PASS,
            customCycle: CYCLE.MONTHLY,
            highlightPrice: true,
            title: getDashboardUpsellTitle(CYCLE.MONTHLY),
        }),
        getDashboardUpsellV2({
            ...upsellsPayload,
            upsellPath: DASHBOARD_UPSELL_PATHS.PASS,
            plan: PLANS.PASS,
            customCycle: CYCLE.YEARLY,
            highlightPrice: true,
            title: getDashboardUpsellTitle(CYCLE.YEARLY),
            isRecommended: true,
        }),
    ].filter(isTruthy);

    return { upsells, handleExplorePlans, telemetryFlow, plansMap, freePlan, user };
};

interface Props extends UpsellsHook {
    subscription: Subscription;
}

const PassPlusFromFree = ({ subscription, upsells, handleExplorePlans }: Props) => {
    const plan = PLANS.PASS;

    return (
        <DashboardGrid>
            <DashboardGridSectionHeader
                title={c('Headline').t`Compare plans`}
                cta={
                    <Button color="norm" shape="ghost" onClick={handleExplorePlans}>
                        {c('Action').t`Compare all plans`}
                        <IcChevronRight className="shrink-0 ml-1 rtl:mirror" />
                    </Button>
                }
            />

            <UpsellMultiBox
                style="card"
                header={<PlanIconName logo={<PlanIcon planName={plan} />} topLine={PLAN_NAMES[plan]} />}
                upsellPanels={
                    <>
                        {subscription && upsells && (
                            <div className="flex flex-column lg:flex-row gap-4 flex-nowrap mb-4">
                                <UpsellPanelsV2 upsells={upsells} subscription={subscription} />
                            </div>
                        )}
                        <div className="flex lg:flex-row flex-column gap-4 lg:items-center">
                            <ul className="unstyled grid lg:grid-cols-2 xl:grid-cols-3 gap-4 m-0 lg:flex-1">
                                {getPassFeatures().map(({ id, text, tooltip, icon: FeatureIcon }) => {
                                    return (
                                        <li key={id} className="flex items-center flex-nowrap">
                                            {FeatureIcon && (
                                                <FeatureIcon size={6} className="shrink-0 mr-2 color-primary" />
                                            )}
                                            {text}
                                            {tooltip && <Info buttonClass="ml-2 align-middle" title={tooltip} />}
                                        </li>
                                    );
                                })}
                            </ul>
                            <div>{c('Features').t`and more premium features...`}</div>
                        </div>
                    </>
                }
                upsellGradient="unlimited"
            ></UpsellMultiBox>
        </DashboardGrid>
    );
};

export default PassPlusFromFree;
