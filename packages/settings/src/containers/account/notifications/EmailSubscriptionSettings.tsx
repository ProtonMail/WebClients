import { usePasswordReminder } from '@proton/account/passwordReminder/hooks';
import { DashboardCardDivider } from '@proton/atoms/DashboardCard/DashboardCard';
import { EmailSubscriptionDescription } from '@proton/components/containers/account/EmailSubscriptionSection';
import { EmailSubscriptionCardToggles } from '@proton/components/containers/account/EmailSubscriptionToggles';
import { PasswordRemindersRow } from '@proton/components/containers/account/passwordReminders/PasswordRemindersSettings';
import { useEmailSubscriptions } from '@proton/components/containers/account/useEmailSubscriptions';
import PrivateMainSettingsArea from '@proton/components/containers/layout/PrivateMainSettingsArea';
import {
    type SectionConfig,
    SettingsCardMaxWidth,
    SettingsLayoutVariant,
} from '@proton/components/containers/layout/interface';

interface Props {
    /** Its subsections must list the groups in the order rendered here */
    config: SectionConfig;
}

/** Settings page with one card per email subscription group */
const EmailSubscriptionSettings = ({ config }: Props) => {
    const { groups, ...rest } = useEmailSubscriptions();
    const { isAvailable: isPasswordReminderAvailable } = usePasswordReminder();

    return (
        <PrivateMainSettingsArea
            config={{ ...config, description: <EmailSubscriptionDescription /> }}
            variant={SettingsLayoutVariant.Card}
            maxWidth={SettingsCardMaxWidth.Narrow}
        >
            <EmailSubscriptionCardToggles subscriptions={groups.general.toggles} {...rest} />
            <EmailSubscriptionCardToggles subscriptions={groups.product.toggles} {...rest} />
            <EmailSubscriptionCardToggles subscriptions={groups.accountUpdates.toggles} {...rest} />
            <>
                <EmailSubscriptionCardToggles subscriptions={groups.notifications.toggles} layout="stacked" {...rest} />
                {isPasswordReminderAvailable && (
                    <>
                        <DashboardCardDivider />
                        <PasswordRemindersRow />
                    </>
                )}
            </>
        </PrivateMainSettingsArea>
    );
};

export default EmailSubscriptionSettings;
