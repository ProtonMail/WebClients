import { useUpdateMailSetting } from '../../hooks/useUpdateMailSetting';
import { useMailSettings } from '../../store/mailSettings/hooks';
import { useCategoriesTelemetry } from './useCategoriesTelemetry';
import { useMarkOnboardingComplete } from './useMarkOnboardingComplete';

export const useCategoriesToggle = () => {
    const { update, isLoading } = useUpdateMailSetting();

    const [mailSettings, mailSettingsLoading] = useMailSettings();

    const { sendReportChangeCategorySettings } = useCategoriesTelemetry();
    const markOnboardingComplete = useMarkOnboardingComplete();

    const handleChange = ({ checked, notification }: { checked: boolean; notification: boolean }) => {
        update('MailCategoryView', checked, { notify: notification });
        // Disabling categories opts the user out of the onboarding for good.
        // This prevents the onboarding flow from reappearing if the user re-enables categories and is eligible.
        if (!checked) {
            markOnboardingComplete();
        }

        sendReportChangeCategorySettings(checked);
    };

    return {
        state: mailSettings.MailCategoryView,
        handleChange,
        loading: mailSettingsLoading || isLoading('MailCategoryView'),
    };
};
