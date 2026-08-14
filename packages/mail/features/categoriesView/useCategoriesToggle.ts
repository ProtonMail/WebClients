import { c } from 'ttag';

import useApi from '@proton/app-context/useApi';
import useNotifications from '@proton/app-context/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import useToggle from '@proton/hooks/useToggle';
import { baseUseDispatch } from '@proton/react-redux-store';
import { updateMailCategoryView } from '@proton/shared/lib/api/mailSettings';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';

import { mailSettingsActions } from '../../store/mailSettings';
import { useMailSettings } from '../../store/mailSettings/hooks';
import { useCategoriesTelemetry } from './useCategoriesTelemetry';
import { useMarkOnboardingComplete } from './useMarkOnboardingComplete';

export const useCategoriesToggle = () => {
    const api = useApi();
    const dispatch = baseUseDispatch();

    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();

    const [mailSettings, mailSettingsLoading] = useMailSettings();
    const { state, toggle } = useToggle(mailSettings.MailCategoryView);

    const { sendReportChangeCategorySettings } = useCategoriesTelemetry();
    const markOnboardingComplete = useMarkOnboardingComplete();

    const handleChange = ({ checked, notification }: { checked: boolean; notification: boolean }) => {
        const run = async () => {
            const response = await api<{ MailSettings: MailSettings }>(updateMailCategoryView(checked));
            dispatch(mailSettingsActions.updateMailSettings(response.MailSettings));
            toggle();

            // Disabling categories opts the user out of the onboarding for good.
            // This prevents the onboarding flow from reappearing if the user re-enables categories and is eligible.
            if (!checked) {
                markOnboardingComplete();
            }

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
