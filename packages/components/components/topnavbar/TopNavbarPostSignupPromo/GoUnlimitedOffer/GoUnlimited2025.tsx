import { useState } from 'react';

import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import { useNotifications } from '@proton/app-context/useNotifications';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { CYCLE, PLANS } from '@proton/payments/core/constants';
import { TelemetryUnlimitedOffer2025 } from '@proton/shared/lib/api/telemetry';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS, APPS_WITH_IN_APP_PAYMENTS, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpgradePath, getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';

import { useSubscriptionModal } from '../../../../containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../../../containers/payments/subscription/constants';
import useSettingsLink from '../../../link/useSettingsLink';
import { SpotlightWithPromo } from '../common/SpotlightWithPromo';
import { GoUnlimitedOfferContent } from './components/GoUnlimitedOfferContent';
import { useGoUnlimited2025Config } from './helpers/configuration';
import { HIDE_OFFER } from './helpers/interface';
import { useGoUnlimited2025 } from './hooks/useGoUnlimited2025';
import { useGoUnlimitedOfferTelemetry } from './hooks/useGoUnlimitedOfferTelemetry';

export const defaultOfferUpsellConfig = {
    step: SUBSCRIPTION_STEPS.CHECKOUT,
    plan: PLANS.BUNDLE,
    cycle: CYCLE.YEARLY,
    minimumCycle: CYCLE.YEARLY,
    maximumCycle: CYCLE.YEARLY,
};

export const GoUnlimited2025 = () => {
    const { APP_NAME: app } = useConfig();
    const parentApp = getAppFromPathnameSafe(window.location.pathname);

    const { openSpotlight } = useGoUnlimited2025();

    const [openSubscriptionModal] = useSubscriptionModal();

    const { update } = useFeature(FeatureCode.OfferGoUnlimited2025);

    const upsellRef = getUpsellRefFromApp({
        app,
        feature: MAIL_UPSELL_PATHS.GO_UNLIMITED_2025,
        component: UPSELL_COMPONENT.MODAL,
        fromApp: parentApp,
    });

    const [spotlightState, setSpotlightState] = useState(openSpotlight);
    const { createNotification } = useNotifications();

    const { sendTelemetryReportGoUnlimited2025 } = useGoUnlimitedOfferTelemetry(app);

    const [subscription, loadingSubscription] = useSubscription();

    const [user] = useUser();

    const goToSettings = useSettingsLink();

    const config = useGoUnlimited2025Config();

    const handleClose = () => {
        setSpotlightState(false);
    };

    const handleHideOffer = () => {
        sendTelemetryReportGoUnlimited2025(TelemetryUnlimitedOffer2025.clickHideOffer, config.type);

        createNotification({
            text: c('Offer').t`This offer won't be shown again.`,
        });

        setSpotlightState(false);
        void update(HIDE_OFFER);
    };

    const upsellInApp = () => {
        openSubscriptionModal({
            disablePlanSelection: true,
            ...defaultOfferUpsellConfig,
            upsellRef,
            onSubscribed: () => {
                sendTelemetryReportGoUnlimited2025(TelemetryUnlimitedOffer2025.userSubscribed, config.type);
            },
        });
    };

    const upsellInSettings = () => {
        goToSettings(
            addUpsellPath(
                getUpgradePath({
                    user,
                    subscription,
                    app,
                    target: 'checkout',
                    ...defaultOfferUpsellConfig,
                }),
                upsellRef
            )
        );
    };

    const handleUpsellClick = () => {
        handleClose();

        sendTelemetryReportGoUnlimited2025(TelemetryUnlimitedOffer2025.clickUpsellButton, config.type);
        if (APPS_WITH_IN_APP_PAYMENTS.has(app) && app !== APPS.PROTONACCOUNT) {
            upsellInApp();
        } else {
            upsellInSettings();
        }
    };

    if (loadingSubscription || config.loading || config.price === 0) {
        return null;
    }

    return (
        <SpotlightWithPromo
            promoOnClick={() => {
                setSpotlightState(true);
                sendTelemetryReportGoUnlimited2025(TelemetryUnlimitedOffer2025.clickTopNavbar, config.type);
            }}
            promoIcon={config.topButton?.icon}
            promoChildren={config.topButton?.title}
            promoColor="norm"
            spotlightShow={spotlightState}
            spotlightInnerClassName="spotlight-inner--center"
            spotlightOnClose={() => {
                sendTelemetryReportGoUnlimited2025(TelemetryUnlimitedOffer2025.closeOffer, config.type);
                handleClose();
            }}
            spotlightContent={
                <GoUnlimitedOfferContent
                    config={config}
                    onNeverShow={handleHideOffer}
                    onUpsellClick={handleUpsellClick}
                />
            }
        />
    );
};
