import { type FC, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import img from '@proton/pass/assets/upsell/family-plan-2024.png';
import type { BaseSpotlightMessage } from '@proton/pass/components/Spotlight/SpotlightContent';
import { UpsellRef } from '@proton/pass/constants';
import { useNavigateToUpgrade } from '@proton/pass/hooks/useNavigateToUpgrade';
import { selectUser, selectUserPlan } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { DEFAULT_CURRENCY, PASS_APP_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import './FamilyPlanPromo2024.scss';

enum FamilyPlanCohort {
    EARLY_SUPPORTER = 1,
    PASS_PLUS = 2,
    FREE = 3,
}

const FamilyPlanUpsellRefs = {
    [FamilyPlanCohort.EARLY_SUPPORTER]: UpsellRef.PASS_FAMILY_1LT_299,
    [FamilyPlanCohort.PASS_PLUS]: UpsellRef.PASS_FAMILY_PLUS_399,
    [FamilyPlanCohort.FREE]: UpsellRef.PASS_FAMILY_FREE_399,
};

export const FamilyPlanPromo2024: FC<BaseSpotlightMessage> = ({ onClose = noop }) => {
    const planNameJSX = <strong key="plan-name">{`${PASS_SHORT_APP_NAME} Family`}</strong>;
    const userPlan = useSelector(selectUserPlan);
    const user = useSelector(selectUser);

    const cohort = useMemo<MaybeNull<FamilyPlanCohort>>(() => {
        const isPass2023 = userPlan?.InternalName === 'pass2023';
        const isFree = userPlan?.InternalName === 'free';
        const isPassLaunch = userPlan?.SubscriptionOffer === 'passlaunch';

        if (isPass2023 && isPassLaunch) return FamilyPlanCohort.EARLY_SUPPORTER;
        if (isPass2023) return FamilyPlanCohort.PASS_PLUS;
        if (isFree) return FamilyPlanCohort.FREE;

        return null;
    }, [userPlan]);

    const price = getSimplePriceString(
        user?.Currency ?? DEFAULT_CURRENCY,
        cohort === FamilyPlanCohort.EARLY_SUPPORTER ? 299 : 399
    );

    const upgrade = useNavigateToUpgrade({
        coupon: cohort === FamilyPlanCohort.EARLY_SUPPORTER ? 'PASSEARLYSUPPORTER' : 'PASSFAMILYLAUNCH',
        cycle: '12',
        offer: true,
        plan: 'passfamily2024',
        upsellRef: cohort ? FamilyPlanUpsellRefs[cohort] : undefined,
        email: user?.Email,
    });

    useEffect(() => {
        /* If the user upgraded in the background */
        if (!cohort) onClose();
    }, [cohort]);

    return (
        <>
            <div className="flex items-center w-full z-up">
                <div className="flex flex-column text-sm gap-2 w-3/5">
                    <h4>{c('FamilyPlanPromo2024').jt`Introducing ${planNameJSX}`}</h4>
                    <div>
                        <span className="block">
                            {c('FamilyPlanPromo2024').t`All premium features. 6 users. 1 easy subscription.`}
                        </span>
                        <span className="block">
                            {cohort === FamilyPlanCohort.EARLY_SUPPORTER
                                ? c('FamilyPlanPromo2024').t`Exclusive offer for ${PASS_APP_NAME} early supporters.`
                                : c('FamilyPlanPromo2024').t`Limited-time offer only.`}
                        </span>
                    </div>
                </div>

                <div className="flex-1 text-center">
                    <Button
                        className="button pass-family-plan-banner--btn"
                        size="medium"
                        type="button"
                        onClick={pipe(onClose, upgrade)}
                        pill
                    >
                        {c('FamilyPlanPromo2024').t`Get it for ${price}/month`}
                    </Button>
                </div>
            </div>
            <img src={img} className="pass-family-plan-banner--img" alt="" />
        </>
    );
};
