import { useState } from 'react';

import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import useSpotlightShow from '@proton/components/components/spotlight/useSpotlightShow';
import useUpsellConfig from '@proton/components/components/upsell/config/useUpsellConfig';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { SECOND, SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';

import { SpotlightWithPromo } from '../common/SpotlightWithPromo';
import { AlwaysOnUpsellContent } from './AlwaysOnUpsellContent';
import { useAlwaysOnUpsell } from './useAlwaysOnUpsell';
import { type SUPPORTED_APPS, useProductSpecifics } from './useProductSpecifics';

interface Props {
    app: SUPPORTED_APPS;
}

export const AlwaysOnUpsell = ({ app }: Props) => {
    const { openSpotlight } = useAlwaysOnUpsell();
    const { plan, planName, features, upgradeText, title } = useProductSpecifics(app);
    const goToSettings = useSettingsLink();

    const upsellRef = getUpsellRefFromApp({
        app,
        feature: SHARED_UPSELL_PATHS.TOP_NAVIGATION_BAR,
        component: UPSELL_COMPONENT.BUTTON,
    });

    const { onUpgrade, upgradePath } = useUpsellConfig({
        upsellRef,
        step: SUBSCRIPTION_STEPS.CHECKOUT,
        plan,
    });

    const [spotlightState, setSpotlightState] = useState(openSpotlight);
    const show = useSpotlightShow(spotlightState, 3 * SECOND);

    const handleClose = () => {
        setSpotlightState(false);
    };

    const handleUpsellClick = () => {
        handleClose();

        /**
         * Some products (like Drive) don't support in-app subscriptions,
         * and must use an alternative route via settings (Account).
         */
        if (onUpgrade) {
            onUpgrade();
        } else {
            goToSettings(upgradePath);
        }
    };

    return (
        <SpotlightWithPromo
            promoOnClick={() => setSpotlightState(!spotlightState)}
            promoIconName="upgrade"
            promoChildren={upgradeText}
            promoColor="outline-gradient"
            spotlightInnerClassName="p-0"
            spotlightShow={show || spotlightState}
            spotlightOnClose={handleClose}
            spotlightContent={
                <AlwaysOnUpsellContent
                    title={title}
                    planName={planName}
                    features={features}
                    onClose={handleClose}
                    onUpsellClick={handleUpsellClick}
                />
            }
        />
    );
};
