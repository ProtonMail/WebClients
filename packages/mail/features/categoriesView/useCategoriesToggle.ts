import { c } from 'ttag';

import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import useToggle from '@proton/components/hooks/useToggle';
import useLoading from '@proton/hooks/useLoading';
import { useCategoriesTelemetry } from '@proton/mail/features/categoriesView/useCategoriesTelemetry';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateMailCategoryView } from '@proton/shared/lib/api/mailSettings';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';

export const useCategoriesToggle = () => {
    const api = useApi();
    const dispatch = useDispatch();

    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();

    const [mailSettings, mailSettingsLoading] = useMailSettings();
    const { state, toggle } = useToggle(mailSettings.MailCategoryView);

    const { sendReportChangeCategorySettings } = useCategoriesTelemetry();

    const handleChange = ({ checked, notification }: { checked: boolean; notification: boolean }) => {
        const run = async () => {
            const response = await api<{ MailSettings: MailSettings }>(updateMailCategoryView(checked));
            dispatch(mailSettingsActions.updateMailSettings(response.MailSettings));
            toggle();

            if (notification) {
                createNotification({ text: c('Success').t`Preference saved` });
            }

            sendReportChangeCategorySettings(checked);
        };

        return withLoading(run());
    };

    return {
        state,
        handleChange,
        loading: mailSettingsLoading || loading,
    };
};
