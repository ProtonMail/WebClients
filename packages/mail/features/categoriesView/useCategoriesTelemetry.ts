import { useMemo } from 'react';

import { useGetSubscription } from '@proton/account/subscription/hooks';
import { useGetUser } from '@proton/account/user/hooks';
import { useGetUserSettings } from '@proton/account/userSettings/hooks';
import useApi from '@proton/components/hooks/useApi';
import {
    TelemetryCategoriesOnboardingEvents,
    type TelemetryEvents,
    TelemetryMeasurementGroups,
} from '@proton/shared/lib/api/telemetry';
import type { CategoryLabelID } from '@proton/shared/lib/constants';
import { sendTelemetryReportWithBaseDimensions } from '@proton/shared/lib/helpers/metrics';
import { SentryMailInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

type RecategorizeSource = 'drag_and_drop' | 'context_menu' | 'move_to_folder';
type CategoriesClickSource = 'tab' | 'sidebar' | 'commander' | 'shortcuts';

export const useCategoriesTelemetry = () => {
    const api = useApi();
    const getUser = useGetUser();
    const getSubscription = useGetSubscription();
    const getUserSettings = useGetUserSettings();

    return useMemo(() => {
        const sendReport = async (event: TelemetryEvents, dimensions?: Record<string, string>) => {
            const [user, subscription, userSettings] = await Promise.all([
                getUser(),
                getSubscription(),
                getUserSettings(),
            ]).catch((e) => {
                traceInitiativeError(SentryMailInitiatives.CATEGORIES_VIEW, e);
                return [];
            });

            if (!user || !subscription || !userSettings) {
                return;
            }

            void sendTelemetryReportWithBaseDimensions({
                api,
                user,
                subscription,
                userSettings,
                measurementGroup: TelemetryMeasurementGroups.categoriesView,
                event,
                dimensions: dimensions,
                delay: true,
            });
        };

        const sendEventOnboardingAccept = () => {
            void sendReport(TelemetryCategoriesOnboardingEvents.onboarding_reply, {
                reply: 'accept',
            });
        };

        const sendEventOnboardingDismiss = () => {
            void sendReport(TelemetryCategoriesOnboardingEvents.onboarding_reply, {
                reply: 'dismiss',
            });
        };

        const sendReportCategoriesNav = (navSource: CategoriesClickSource, categoryId: CategoryLabelID) => {
            void sendReport(TelemetryCategoriesOnboardingEvents.category_nav, {
                navSource,
                categoryId,
            });
        };

        const sendReportChangeCategorySettings = (newValue: boolean) => {
            void sendReport(TelemetryCategoriesOnboardingEvents.settings_toggle_category_view, {
                newValue: newValue ? 'true' : 'false',
            });
        };

        const sendReportToggleCategory = (categoryId: string, newValue: boolean) => {
            void sendReport(TelemetryCategoriesOnboardingEvents.settings_toggle_category, {
                categoryId,
                newValue: newValue ? 'true' : 'false',
            });
        };

        const sendReportToggleNotification = (categoryId: string, newValue: boolean) => {
            void sendReport(TelemetryCategoriesOnboardingEvents.settings_toggle_notification, {
                categoryId,
                newValue: newValue ? 'true' : 'false',
            });
        };

        const sendReportRecategorizeEmail = (
            recategorizeSource: RecategorizeSource,
            sourceLabelId: CategoryLabelID,
            destinationLabelId: string,
            elementsNumber: number
        ) => {
            void sendReport(TelemetryCategoriesOnboardingEvents.recategorize_email, {
                recategorizeSource,
                sourceLabelId,
                destinationLabelId,
                elementsNumber: elementsNumber.toString(),
            });
        };

        return {
            sendEventOnboardingAccept,
            sendEventOnboardingDismiss,
            sendReportRecategorizeEmail,
            sendReportToggleCategory,
            sendReportToggleNotification,
            sendReportChangeCategorySettings,
            sendReportCategoriesNav,
        };
    }, []);
};
