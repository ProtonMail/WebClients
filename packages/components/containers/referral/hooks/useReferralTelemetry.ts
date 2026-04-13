import { useCallback } from 'react';

import useApi from '@proton/components/hooks/useApi';
import useConfig from '@proton/components/hooks/useConfig';
import { TelemetryMeasurementGroups, TelemetryReferralDiscoverEvents } from '@proton/shared/lib/api/telemetry';
import { normalizeProduct } from '@proton/shared/lib/apps/product';
import { sendTelemetryReport, telemetryReportsBatchQueue } from '@proton/shared/lib/helpers/metrics';

export type SharePlatform = 'linkedin' | 'x' | 'reddit' | 'facebook' | 'whatsapp';

export const useReferralTelemetry = () => {
    const api = useApi();
    const { APP_NAME } = useConfig();
    const appName = normalizeProduct(APP_NAME);

    const sendEvent = useCallback(
        (event: TelemetryReferralDiscoverEvents, extraDimensions?: Record<string, string>) => {
            void sendTelemetryReport({
                api,
                measurementGroup: TelemetryMeasurementGroups.referralDiscover,
                event,
                dimensions: { appName, ...extraDimensions },
                delay: false,
            });
            void telemetryReportsBatchQueue.flush();
        },
        [api, appName]
    );

    const sendTopBarButtonView = useCallback(() => {
        sendEvent(TelemetryReferralDiscoverEvents.top_bar_button_view);
    }, [sendEvent]);

    const sendTopBarButtonClick = useCallback(() => {
        sendEvent(TelemetryReferralDiscoverEvents.top_bar_button_click);
    }, [sendEvent]);

    const sendTopBarSpotlightCtaClick = useCallback(() => {
        sendEvent(TelemetryReferralDiscoverEvents.top_bar_spotlight_cta_click);
    }, [sendEvent]);

    const sendSettingsSpotlightView = useCallback(() => {
        sendEvent(TelemetryReferralDiscoverEvents.settings_spotlight_view);
    }, [sendEvent]);

    const sendReferralPageView = useCallback(() => {
        sendEvent(TelemetryReferralDiscoverEvents.referral_page_view);
    }, [sendEvent]);

    const sendDrawerAppView = useCallback(() => {
        sendEvent(TelemetryReferralDiscoverEvents.drawer_app_view);
    }, [sendEvent]);

    const sendCopyLinkDrawer = useCallback(() => {
        sendEvent(TelemetryReferralDiscoverEvents.copy_link_drawer);
    }, [sendEvent]);

    const sendCopyLinkPage = useCallback(() => {
        sendEvent(TelemetryReferralDiscoverEvents.copy_link_page);
    }, [sendEvent]);

    const sendShare = useCallback(
        (platform: SharePlatform) => {
            sendEvent(TelemetryReferralDiscoverEvents.share, { platform });
        },
        [sendEvent]
    );

    const sendEmailInvite = useCallback(() => {
        sendEvent(TelemetryReferralDiscoverEvents.send_email_invite);
    }, [sendEvent]);

    return {
        sendTopBarButtonView,
        sendTopBarButtonClick,
        sendTopBarSpotlightCtaClick,
        sendSettingsSpotlightView,
        sendReferralPageView,
        sendDrawerAppView,
        sendCopyLinkDrawer,
        sendCopyLinkPage,
        sendShare,
        sendEmailInvite,
    };
};
