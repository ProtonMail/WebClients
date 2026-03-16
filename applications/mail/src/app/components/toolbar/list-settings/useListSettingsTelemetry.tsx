import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import useApi from '@proton/components/hooks/useApi';
import { TelemetryListSetting, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReportWithBaseDimensions } from '@proton/shared/lib/helpers/metrics';

export const useListSettingsTelemetry = () => {
    const api = useApi();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [userSettings] = useUserSettings();

    const sendReport = (event: TelemetryListSetting) => {
        void sendTelemetryReportWithBaseDimensions({
            api,
            user,
            subscription,
            userSettings,
            measurementGroup: TelemetryMeasurementGroups.mailListSettings,
            event,
            delay: false,
        });
    };

    // Filters options
    const sendAllReport = () => {
        sendReport(TelemetryListSetting.list_filter_all);
    };
    const sendReadReport = () => {
        sendReport(TelemetryListSetting.list_filter_read);
    };
    const sendUnreadReport = () => {
        sendReport(TelemetryListSetting.list_filter_unread);
    };
    const sendFileReport = () => {
        sendReport(TelemetryListSetting.list_filter_file);
    };

    // Sorting options
    const sendNewestFirstReport = () => {
        sendReport(TelemetryListSetting.list_order_new_first);
    };
    const sendOldestFirstReport = () => {
        sendReport(TelemetryListSetting.list_order_old_first);
    };
    const sendLargestFirstReport = () => {
        sendReport(TelemetryListSetting.list_order_large_first);
    };
    const sendSmallestFirstReport = () => {
        sendReport(TelemetryListSetting.list_order_small_first);
    };

    return {
        sendAllReport,
        sendReadReport,
        sendUnreadReport,
        sendFileReport,
        sendNewestFirstReport,
        sendOldestFirstReport,
        sendLargestFirstReport,
        sendSmallestFirstReport,
    };
};
