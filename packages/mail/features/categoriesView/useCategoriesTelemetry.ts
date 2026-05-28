import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import useApi from '@proton/components/hooks/useApi';
import {
    TelemetryCategoriesOnboardingEvents,
    type TelemetryEvents,
    TelemetryMeasurementGroups,
} from '@proton/shared/lib/api/telemetry';
import type { CategoryLabelID } from '@proton/shared/lib/constants';
import { sendTelemetryReportWithBaseDimensions } from '@proton/shared/lib/helpers/metrics';

type RecategorizeSource = 'drag_and_drop' | 'context_menu' | 'move_to_folder';
type CategoriesClickSource = 'tab' | 'sidebar' | 'commander' | 'shortcuts';

export const useCategoriesTelemetry = () => {
    const api = useApi();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [userSettings] = useUserSettings();

    const sendReport = (event: TelemetryEvents, dimensions?: Record<string, string>) => {
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
        sendReport(TelemetryCategoriesOnboardingEvents.onboarding_reply, {
            reply: 'accept',
        });
    };

    const sendEventOnboardingDismiss = () => {
        sendReport(TelemetryCategoriesOnboardingEvents.onboarding_reply, {
            reply: 'dismiss',
        });
    };

    const sendReportCloseCategoryCard = (categoryID: CategoryLabelID) => {
        sendReport(TelemetryCategoriesOnboardingEvents.onboarding_card_close, {
            category_id: categoryID,
        });
    };

    const sendReportCategoriesNav = (source: CategoriesClickSource, categoryID: CategoryLabelID) => {
        sendReport(TelemetryCategoriesOnboardingEvents.category_nav, {
            source: source,
            category_id: categoryID,
        });
    };

    const sendReportChangeCategorySettings = (newValue: boolean) => {
        sendReport(TelemetryCategoriesOnboardingEvents.settings_toggle_category_view, {
            new_value: newValue ? 'true' : 'false',
        });
    };

    const sendReportToggleCategory = (categoryID: CategoryLabelID, newValue: boolean) => {
        sendReport(TelemetryCategoriesOnboardingEvents.settings_toggle_category, {
            category_id: categoryID,
            new_value: newValue ? 'true' : 'false',
        });
    };

    const sendReportToggleNotification = (categoryID: CategoryLabelID, newValue: boolean) => {
        sendReport(TelemetryCategoriesOnboardingEvents.settings_toggle_notification, {
            category_id: categoryID,
            new_value: newValue ? 'true' : 'false',
        });
    };

    const sendReportRecategorizeEmail = (
        source: RecategorizeSource,
        sourceLabelID: CategoryLabelID,
        destinationLabelID: string,
        elementsNumber: number
    ) => {
        sendReport(TelemetryCategoriesOnboardingEvents.recategorize_email, {
            source: source,
            source_label_id: sourceLabelID,
            destination_label_id: destinationLabelID,
            elements_number: elementsNumber.toString(),
        });
    };

    return {
        sendEventOnboardingAccept,
        sendEventOnboardingDismiss,
        sendReportCloseCategoryCard,
        sendReportRecategorizeEmail,
        sendReportToggleCategory,
        sendReportToggleNotification,
        sendReportChangeCategorySettings,
        sendReportCategoriesNav,
    };
};
