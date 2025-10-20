import { useState } from 'react';

import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import useConfig from '@proton/components/hooks/useConfig';
import useNotifications from '@proton/components/hooks/useNotifications';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { CYCLE, PLANS } from '@proton/payments/core/constants';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS, APPS_WITH_IN_APP_PAYMENTS, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpgradePath, getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';

import { SpotlightWithPromo } from '../common/SpotlightWithPromo';
import { UnlimitedToDuoOfferContent } from './components/UnlimitedToDuoOfferContent';
import { useUnlimitedToDuoConfig } from './hooks/useUnlimitedToDuoConfig';

const duoOfferUpsellConfig = {
    step: SUBSCRIPTION_STEPS.CHECKOUT,
    plan: PLANS.DUO,
    cycle: CYCLE.YEARLY,
    minimumCycle: CYCLE.YEARLY,
    maximumCycle: CYCLE.YEARLY,
};

export const UnlimitedToDuoOffer = () => {
    const [spotlightState, setSpotlightState] = useState(false);

    const [openSubscriptionModal] = useSubscriptionModal();
    const [subscription, loadingSubscription] = useSubscription();
    const { APP_NAME: app } = useConfig();
    const goToSettings = useSettingsLink();
    const { createNotification } = useNotifications();
    const [user] = useUser();
    const config = useUnlimitedToDuoConfig();
    const { update } = useFeature(FeatureCode.HideUnlimitedToDuoPermanentOffer);

    const parentApp = getAppFromPathnameSafe(window.location.pathname);

    const upsellRef = getUpsellRefFromApp({
        app,
        feature: MAIL_UPSELL_PATHS.UNLIMITED_TO_DUO,
        component: UPSELL_COMPONENT.MODAL,
        fromApp: parentApp,
    });

    const handleClose = () => {
        setSpotlightState(false);
    };

    const handleHideOffer = () => {
        createNotification({
            text: c('Offer').t`This offer won't be shown again.`,
        });

        void update(true);

        setSpotlightState(false);
    };

    const upsellInSettings = () => {
        goToSettings(
            getUpgradePath({
                user,
                subscription,
                app,
                target: 'checkout',
                ...duoOfferUpsellConfig,
            })
        );
    };

    const upsellInApp = () => {
        openSubscriptionModal({
            disablePlanSelection: true,
            ...duoOfferUpsellConfig,
            upsellRef,
            metrics: {
                source: 'upsells',
            },
        });
    };

    const handleUpsellClick = () => {
        handleClose();

        if (APPS_WITH_IN_APP_PAYMENTS.has(app) && app !== APPS.PROTONACCOUNT) {
            upsellInApp();
        } else {
            upsellInSettings();
        }
    };

    if (loadingSubscription || config.price === 0) {
        return null;
    }

    return (
        <SpotlightWithPromo
            promoOnClick={() => {
                setSpotlightState(true);
            }}
            promoIconName="lightbulb"
            promoChildren="Double your storage"
            promoColor="norm"
            spotlightShow={spotlightState}
            spotlightOnClose={handleClose}
            spotlightInnerClassName="spotlight-inner--center"
            spotlightContent={
                <UnlimitedToDuoOfferContent
                    config={config}
                    onUpsellClick={handleUpsellClick}
                    onNeverShow={handleHideOffer}
                />
            }
        />
    );
};
