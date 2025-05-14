import { type FC, memo, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { PromotionButton } from '@proton/components/components/button/PromotionButton';
import { WithFeatureFlag } from '@proton/pass/components/Core/WithFeatureFlag';
import { useSpotlightFor } from '@proton/pass/components/Spotlight/WithSpotlight';
import { PASS_PROTON_ANNIVERSARY_END_DATE } from '@proton/pass/constants';
import { selectInAppNotificationsEnabled, selectUser, selectUserPlan } from '@proton/pass/store/selectors';
import { SpotlightMessage } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { isDelinquent } from '@proton/shared/lib/user/helpers';
import clsx from '@proton/utils/clsx';

import { alreadyBoughtOffer, checkPlanEligible } from './ProtonAnniversaryPromo2025.utils';
import { ProtonAnniversaryPromo2025Modal } from './ProtonAnniversaryPromo2025Modal';

import './ProtonAnniversaryPromo2025.scss';

const ProtonAnniversaryPromo2025: FC = memo(() => {
    const user = useSelector(selectUser);
    const plan = useSelector(selectUserPlan);
    const inAppNotificationEnabled = useSelector(selectInAppNotificationsEnabled);

    const [showModal, setShowModal] = useState(false);
    const promoSpotlight = useSpotlightFor(SpotlightMessage.PROTON_ANNIVERSARY_2025_PROMO);

    const planName = plan?.InternalName;
    const subscriptionCoupon = plan?.SubscriptionCoupon;

    const isPlanEligible = !alreadyBoughtOffer(subscriptionCoupon) && checkPlanEligible(planName);
    const isUserEligible = isPlanEligible && inAppNotificationEnabled && user && !isDelinquent(user);

    /** Safe-guard promo end date in case feature flags could not be revalidated */
    const promoOngoing = useMemo(() => new Date().getTime() < PASS_PROTON_ANNIVERSARY_END_DATE, []);
    const canShowPromo = promoSpotlight.open && isUserEligible && promoOngoing;

    return canShowPromo ? (
        <>
            <PromotionButton
                as="button"
                type="button"
                color="norm"
                size="medium"
                responsive
                shape="outline"
                buttonGradient={false}
                iconGradient={false}
                iconName="gift"
                onClick={() => setShowModal(true)}
                className={clsx('button-anniversary-2025 text-uppercase text-semibold')}
                breakpoint=">=xlarge"
            >
                {c('anniversary_2025: offer').t`Anniversary offer`}
            </PromotionButton>
            {showModal && (
                <ProtonAnniversaryPromo2025Modal
                    currency={user.Currency}
                    currentPlan={planName}
                    email={user.Email}
                    onClose={() => setShowModal(false)}
                    onDiscard={promoSpotlight.close}
                />
            )}
        </>
    ) : null;
});

ProtonAnniversaryPromo2025.displayName = 'ProtonAnniversaryPromo2025Memo';

export const ProtonAnniversaryPromo2025Button = WithFeatureFlag(
    ProtonAnniversaryPromo2025,
    PassFeature.PassProtonAnniversaryPromo2025
);
