import { useMemo } from 'react';

import { InAppNotificationPromoButton } from '@proton/pass/components/Notifications/InAppNotificationPromoButton';
import { UpgradeButton } from '@proton/pass/components/Upsell/UpgradeButton';
import { UpsellRef } from '@proton/pass/constants';
import { useMatchUser } from '@proton/pass/hooks/useMatchUser';
import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import { selectActivePromoNotification } from '@proton/pass/store/selectors';
import { getEpoch } from '@proton/pass/utils/time/epoch';

export const UpsellButton = () => {
    const paidUser = useMatchUser({ paid: true });
    const now = useMemo(() => getEpoch(), []);
    const promo = useMemoSelector(selectActivePromoNotification, [now, false]);

    /* Apple refuses that we sell anything in apps including Safari extensions */
    if (BUILD_TARGET === 'safari') return null;

    const showPromo = !!promo;
    const showUpgrade = !showPromo && !paidUser;

    return (
        <>
            {showPromo && <InAppNotificationPromoButton notification={promo} />}
            {showUpgrade && (
                <UpgradeButton
                    upsellRef={UpsellRef.NAVBAR_UPGRADE}
                    iconName="upgrade"
                    iconSize={3.5}
                    iconGradient
                    gradient
                    style={{
                        '--upgrade-color-stop-1': '#9834ff',
                        '--upgrade-color-stop-2': '#F6CC88',
                    }}
                />
            )}
        </>
    );
};
