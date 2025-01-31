import type { ReactElement } from 'react';
import { type FC, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Tooltip } from '@proton/components';
import { SubTheme } from '@proton/pass/components/Layout/Theme/types';
import { ValentinesDayPromoModal } from '@proton/pass/components/Onboarding/ValentinesDayPromoModal';
import { PASS_VALENTINES_DAY_END_DATE, UpsellRef } from '@proton/pass/constants';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { useNavigateToUpgrade } from '@proton/pass/hooks/useNavigateToUpgrade';
import { selectInAppNotificationsEnabled, selectUser, selectUserPlan } from '@proton/pass/store/selectors';
import { PassFeature } from '@proton/pass/types/api/features';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import { COUPON_CODES } from '@proton/shared/lib/constants';
import { isDelinquent } from '@proton/shared/lib/user/helpers';
import clsx from '@proton/utils/clsx';

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

export const ValentinesDayPromo: FC = () => {
    const user = useSelector(selectUser);
    const plan = useSelector(selectUserPlan);
    const inAppNotificationEnabled = useSelector(selectInAppNotificationsEnabled);

    const [showModal, setShowModal] = useState(false);

    /** Upsell free users to Pass Plus and upsell Pass Plus users to Proton Unlimited */
    const isPlanEligible = plan?.InternalName === 'free' || plan?.InternalName === 'pass2023';
    const isUserEligible = isPlanEligible && inAppNotificationEnabled && user && !isDelinquent(user);

    const canShowPromo =
        useFeatureFlag(PassFeature.PassValentinePromo2025) &&
        new Date().getTime() < PASS_VALENTINES_DAY_END_DATE && // in case updated feature flag could not be fetched
        BUILD_TARGET !== 'safari' &&
        isUserEligible;

    const isFreePlan = plan?.InternalName === 'free';
    const planToUpsell = isFreePlan ? PLANS.PASS : PLANS.BUNDLE;

    const getUpsellRef = () => {
        const freeRef = EXTENSION_BUILD ? UpsellRef.VD_25_PASS_FREE_EXTENSION : UpsellRef.VD_25_PASS_FREE_WEB;
        const plusRef = EXTENSION_BUILD ? UpsellRef.VD_25_PASS_PLUS_EXTENSION : UpsellRef.VD_25_PASS_PLUS_WEB;
        return isFreePlan ? freeRef : plusRef;
    };

    const upgrade = useNavigateToUpgrade({
        coupon: COUPON_CODES.LOVEPRIVACY25,
        cycle: '12',
        email: user?.Email,
        plan: planToUpsell,
        offer: planToUpsell === PLANS.PASS ? 'valentine-2025-pass-plus' : 'valentine-2025-pass-bundle',
        upsellRef: getUpsellRef(),
        type: 'offer',
        disableEdit: true,
    });

    /** On web app we open the promo modal,
     * on extension there is not enough space to show the modal so we directly open the upgrade page */
    const handlePromoButtonClick = EXTENSION_BUILD ? upgrade : () => setShowModal(true);

    if (!canShowPromo) return null;

    return (
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
            {showModal && (
                <ValentinesDayPromoModal
                    onClose={() => setShowModal(false)}
                    onUpgradeClick={upgrade}
                    planToUpsell={planToUpsell}
                />
            )}
        </>
    );
};
