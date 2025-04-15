import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components';
import { Icon, ModalTwo, ModalTwoContent, Tooltip } from '@proton/components';
import { type IconName } from '@proton/components/components/icon/Icon';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { getCheckoutRenewNoticeTextFromCheckResult } from '@proton/components/containers/payments/RenewalNotice';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import { useLoading } from '@proton/hooks';
import {
    COUPON_CODES,
    CYCLE,
    type Currency,
    type Cycle,
    PLANS,
    PLAN_NAMES,
    type PaymentsApi,
    type PlanIDs,
    type PlansMap,
} from '@proton/payments';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';

import SaveLabel from '../SaveLabel';
import { type SignupUpsellTelemetryHook } from './useMailSignupUpsellTelemetry';

export type CheckTrialPriceResult = Awaited<ReturnType<typeof checkTrialPriceCommon>>;

export async function checkTrialPriceCommon({
    paymentsApi,
    currency,
    plansMap,
    planName,
    cycle,
    coupon,
}: {
    paymentsApi: PaymentsApi;
    currency: Currency;
    plansMap: PlansMap;
    planName: PLANS;
    cycle: Cycle;
    coupon: string;
}) {
    const planIDs = {
        [planName]: 1,
    };

    const checkResult = await paymentsApi.checkWithAutomaticVersion({
        Plans: planIDs,
        Currency: currency,
        Cycle: cycle,
        Codes: [coupon],
    });

    const plan = plansMap[planName];
    const fullAmount = plan?.Pricing?.[cycle];
    if (!plan || fullAmount === undefined) {
        throw new Error(`Plan ${planName}-${currency}-${cycle}m not found`);
    }

    return {
        checkResult,
        plan,
        plansMap,
        planData: {
            planIDs,
            coupon,
            cycle,
            currency,
        },
        currency,
        fullAmount,
    };
}

type PlanWithTrial = PLANS.MAIL | PLANS.DRIVE | PLANS.PASS;

export type CheckTrialPriceParams = Pick<
    Parameters<typeof checkTrialPriceCommon>[0],
    'paymentsApi' | 'plansMap' | 'currency'
> & {
    planName: PlanWithTrial;
};

export async function checkTrialPrice(params: CheckTrialPriceParams) {
    const config = (() => {
        switch (params.planName) {
            case PLANS.MAIL:
                return {
                    cycle: CYCLE.MONTHLY,
                    coupon: COUPON_CODES.MAILPLUSINTRO,
                };
            case PLANS.DRIVE:
                return {
                    cycle: CYCLE.MONTHLY,
                    coupon: COUPON_CODES.TRYDRIVEPLUS2024,
                };
            case PLANS.PASS:
                return {
                    cycle: CYCLE.MONTHLY,
                    coupon: COUPON_CODES.PASSPLUSINTRO2024,
                };
        }
    })();

    return checkTrialPriceCommon({ ...params, ...config });
}

export interface Props extends ModalProps {
    onConfirm: (data: { planIDs: PlanIDs; cycle: Cycle; coupon: string }) => Promise<unknown>;
    onContinue: () => void;
    planName: PlanWithTrial;
    ctaTitle: string;
    features: { name: string; icon?: IconName }[];
    telemetry?: SignupUpsellTelemetryHook;
    checkTrialResult: CheckTrialPriceResult;
}

const Trial2024UpsellModal = ({
    onConfirm,
    onContinue,
    onClose,
    planName,
    ctaTitle,
    features,
    telemetry,
    checkTrialResult,
    ...rest
}: Props) => {
    const [loading, withLoading] = useLoading();

    const planTitle = PLAN_NAMES[planName];

    const { currency, checkResult, plansMap } = checkTrialResult;
    const discountedPriceElement = (
        <span key="price" className="text-bold">
            {getSimplePriceString(currency, checkResult.AmountDue)}
        </span>
    );

    const close = (
        <Tooltip title={c('Action').t`Close`}>
            <Button
                className="shrink-0"
                icon
                shape="ghost"
                data-testid="modal:close"
                onClick={() => {
                    void telemetry?.close?.();
                    onContinue();
                    onClose?.();
                }}
                size="small"
            >
                <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
            </Button>
        </Tooltip>
    );

    const planIDs = checkTrialResult.planData.planIDs;

    return (
        <ModalTwo {...rest} size="small">
            <div
                className="flex mb-4 items-center justify-center"
                style={{ color: 'var(--promotion-text-color)', background: 'var(--promotion-background-start)' }}
            >
                <div className="visibility-hidden">{close}</div>
                <div className="flex-1 text-center">
                    <span>
                        <Icon name="hourglass" size={3.5} />
                        <span className="ml-1">
                            {ctaTitle}: {c('mailtrial2024: Info').jt`Get ${planTitle} for ${discountedPriceElement}`}
                        </span>
                    </span>
                </div>
                <div>{close}</div>
            </div>
            <ModalTwoContent>
                <div>
                    <div className="text-4xl text-bold text-center mb-2">{planTitle}</div>
                    <div className="flex gap-2 items-center justify-center">
                        <span className="color-primary text-bold h1">{discountedPriceElement}</span>
                        <div className="flex flex-column justify-center text-left">
                            <span>
                                <SaveLabel percent={80} />
                            </span>
                            <span className="text-strike text-sm color-weak">
                                {getSimplePriceString(currency, checkTrialResult.fullAmount)}
                            </span>
                        </div>
                    </div>
                    <div className="mb-4 color-weak text-center">
                        {c('mailtrial2024: Info').t`for your first month`}
                    </div>
                </div>
                <Button
                    color="norm"
                    fullWidth
                    className="mb-2"
                    size="large"
                    loading={loading}
                    onClick={async () => {
                        void telemetry?.upsell?.();
                        await withLoading(onConfirm(checkTrialResult.planData).then(() => onClose?.()));
                    }}
                >
                    {c('Action').t`Get limited-time offer`}
                </Button>
                <div>
                    <PlanCardFeatureList
                        icon
                        iconColor="color-primary"
                        features={features.map((feature) => ({
                            ...feature,
                            text: feature.name,
                            included: true,
                        }))}
                    />
                </div>
                <div className="color-weak text-sm text-center mt-2 mb-2">
                    {getCheckoutRenewNoticeTextFromCheckResult({
                        checkResult,
                        plansMap,
                        planIDs,
                        short: true,
                        app: ((): APP_NAMES => {
                            switch (planName) {
                                case PLANS.DRIVE:
                                    return APPS.PROTONDRIVE;
                                case PLANS.PASS:
                                    return APPS.PROTONPASS;
                                case PLANS.MAIL:
                                default:
                                    return APPS.PROTONMAIL;
                            }
                        })(),
                    })}
                </div>
                <Button
                    shape="ghost"
                    color="norm"
                    size="large"
                    onClick={() => {
                        void telemetry?.noThanks?.();
                        onContinue();
                        onClose?.();
                    }}
                    fullWidth
                >
                    {c('Action').t`No, thanks`}
                </Button>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default Trial2024UpsellModal;
