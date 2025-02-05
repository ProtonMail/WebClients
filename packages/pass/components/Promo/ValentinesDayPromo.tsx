import type { ReactElement } from 'react';
import { type FC, memo, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Tooltip } from '@proton/components';
import { WithFeatureFlag } from '@proton/pass/components/Core/WithFeatureFlag';
import { SubTheme } from '@proton/pass/components/Layout/Theme/types';
import { PASS_VALENTINES_DAY_END_DATE, UpsellRef } from '@proton/pass/constants';
import { useNavigateToUpgrade } from '@proton/pass/hooks/useNavigateToUpgrade';
import { selectInAppNotificationsEnabled, selectUser, selectUserPlan } from '@proton/pass/store/selectors';
import type { PassPlanResponse } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { COUPON_CODES, PLANS, PLAN_NAMES } from '@proton/payments';
import { isDelinquent } from '@proton/shared/lib/user/helpers';
import clsx from '@proton/utils/clsx';

import { ValentinesDayPromoModal } from './ValentinesDayPromoModal';

const FORBIDDEN_COUPONS = new Set<string>([
    COUPON_CODES.LOVEPRIVACY25,
    COUPON_CODES.LOVEPRIVACY225,
    COUPON_CODES.PASSFLASH5025,
]);

const getUpsellRef = (isFreePlan: boolean) => {
    const freeRef = EXTENSION_BUILD ? UpsellRef.VD_25_PASS_FREE_EXTENSION : UpsellRef.VD_25_PASS_FREE_WEB;
    const plusRef = EXTENSION_BUILD ? UpsellRef.VD_25_PASS_PLUS_EXTENSION : UpsellRef.VD_25_PASS_PLUS_WEB;
    return isFreePlan ? freeRef : plusRef;
};

/** Upsell free users to Pass Plus and upsell Pass/Mail/VPN/Drive Plus users
 * to Unlimited. Exclude users who have already consumed the offer. */
const getPlanEligble = ({ InternalName, SubscriptionCoupon }: PassPlanResponse) => {
    const planEligble =
        InternalName === PLANS.FREE ||
        InternalName === PLANS.PASS ||
        InternalName === PLANS.MAIL ||
        InternalName === PLANS.VPN ||
        InternalName === PLANS.VPN2024 ||
        InternalName === PLANS.VPN_PASS_BUNDLE ||
        InternalName === PLANS.DRIVE;
    const couponEligble = !FORBIDDEN_COUPONS.has(SubscriptionCoupon ?? '');
    return planEligble && couponEligble;
};

type MaybeToolTipProps = { children: ReactElement; planName: string };

const MaybeToolTip: FC<MaybeToolTipProps> = ({ children, planName }) =>
    EXTENSION_BUILD ? (
        <Tooltip
            openDelay={500}
            originalPlacement={'bottom'}
            title={c('Valentine_2025').t`Valentine's deal: ${planName} 50% off for you`}
        >
            {children}
        </Tooltip>
    ) : (
        children
    );

const ValentinesDayPromo: FC = memo(() => {
    const user = useSelector(selectUser);
    const plan = useSelector(selectUserPlan);
    const inAppNotificationEnabled = useSelector(selectInAppNotificationsEnabled);

    const [showModal, setShowModal] = useState(false);

    const isFreePlan = plan?.InternalName === PLANS.FREE;
    const planToUpsell = isFreePlan ? PLANS.PASS : PLANS.BUNDLE;
    const isPlanEligible = plan && getPlanEligble(plan);
    const isUserEligible = isPlanEligible && inAppNotificationEnabled && user && !isDelinquent(user);

    const canShowPromo = useMemo(
        /** Safe-guard promo end date in case feature flags could not be revalidated */
        () => isUserEligible && new Date().getTime() < PASS_VALENTINES_DAY_END_DATE,
        [isUserEligible]
    );

    const upgrade = useNavigateToUpgrade({
        coupon: COUPON_CODES.LOVEPRIVACY25,
        cycle: '12',
        email: user?.Email,
        plan: planToUpsell,
        offer: planToUpsell === PLANS.PASS ? 'valentine-2025-pass-plus' : 'valentine-2025-pass-bundle',
        upsellRef: getUpsellRef(isFreePlan),
        type: 'offer',
        disableEdit: true,
    });

    /** On the web app we open the promo modal, on the
     * extension there is not enough space to show the
     * modal so we directly open the upgrade page */
    const handlePromoButtonClick = EXTENSION_BUILD ? upgrade : () => setShowModal(true);

    const onClose = () => setShowModal(false);

    return canShowPromo ? (
        <>
            <MaybeToolTip planName={PLAN_NAMES[planToUpsell]}>
                <Button
                    shape="solid"
                    color="weak"
                    className={clsx('flex gap-1.5 text-sm', SubTheme.RED)}
                    onClick={handlePromoButtonClick}
                    size="small"
                >
                    <Icon size={3.5} name="gift-2" />
                    <span className="hidden md:block">{c('Valentine_2025').t`VALENTINE'S DEAL`}</span>
                </Button>
            </MaybeToolTip>

            {!EXTENSION_BUILD && showModal && (
                <ValentinesDayPromoModal
                    onClose={onClose}
                    onUpgradeClick={pipe(upgrade, onClose)}
                    planToUpsell={planToUpsell}
                />
            )}
        </>
    ) : null;
});

ValentinesDayPromo.displayName = 'ValentinesDayPromoMemo';

export const ValentinesDayPromoButton = WithFeatureFlag(ValentinesDayPromo, PassFeature.PassValentinePromo2025);
