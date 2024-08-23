import { c } from 'ttag';

import Info from '@proton/components/components/link/Info';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import useApi from '@proton/components/hooks/useApi';
import useEventManager from '@proton/components/hooks/useEventManager';
import useNotifications from '@proton/components/hooks/useNotifications';
import useUser from '@proton/components/hooks/useUser';
import useUserSettings from '@proton/components/hooks/useUserSettings';
import { patchNews } from '@proton/shared/lib/api/settings';
import {
    APPS,
    MAIL_APP_NAME,
    NEWSLETTER_SUBSCRIPTIONS,
    NEWSLETTER_SUBSCRIPTIONS_BITS,
} from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { getStaticURL } from '@proton/shared/lib/helpers/url';
import { SETTINGS_STATUS } from '@proton/shared/lib/interfaces';

import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import SettingsSection from '../account/SettingsSection';
import ToggleAssistantContainer from '../general/ToggleAssistant/ToggleAssistantContainer';
import DailyEmailNotificationToggle from '../recovery/DailyEmailNotificationToggle';
import RecoveryEmail from '../recovery/email/RecoveryEmail';

const MessagesGeneralSection = () => {
    const [userSettings] = useUserSettings();
    const [user, userLoading] = useUser();
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const showRecoveryEmailInput = !user.isPrivate;
    const canEnableDailyEmails = !!userSettings?.Email?.Value;
    const isDailyEmailEnabled =
        canEnableDailyEmails && hasBit(userSettings.News, NEWSLETTER_SUBSCRIPTIONS_BITS.NEW_EMAIL_NOTIF);

    const handleChangeEmailNotify = async () => {
        if (!canEnableDailyEmails) {
            createNotification({
                type: 'error',
                text: c('Error').t`Please set a recovery/notification email first`,
            });
            return;
        }

        await api(
            patchNews({
                [NEWSLETTER_SUBSCRIPTIONS.NEW_EMAIL_NOTIF]: !isDailyEmailEnabled,
            })
        );
        await call();
    };

    return (
        <>
            <SettingsSection>
                <SettingsLayout>
                    <SettingsLayoutLeft>
                        <label htmlFor="dailyNotificationsToggle" className="flex-1">
                            <span className="pr-2 text-semibold">{c('Label').t`Daily email notifications`}</span>
                            <Info
                                url={getStaticURL('/support/notification-email')}
                                title={c('Info')
                                    .t`When notifications are enabled, we'll send an alert to your recovery email address if you have new messages in your ${MAIL_APP_NAME} account.`}
                            />
                        </label>

                        {!userLoading && !showRecoveryEmailInput && (
                            <div className="text-sm">
                                <SettingsLink path="/recovery#account" app={APPS.PROTONMAIL}>
                                    {isDailyEmailEnabled && userSettings?.Email?.Status === SETTINGS_STATUS.UNVERIFIED
                                        ? c('Action').t`Requires a verified recovery email address`
                                        : c('Link').t`Set email address`}
                                </SettingsLink>{' '}
                            </div>
                        )}
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight className="flex flex-1 items-center">
                        {!userLoading && showRecoveryEmailInput && (
                            <RecoveryEmail
                                className="mb-4 md:mb-0"
                                email={userSettings.Email}
                                hasReset={!!userSettings.Email.Reset}
                                hasNotify={!!userSettings.Email.Notify}
                            />
                        )}
                        <div className="flex items-center">
                            <DailyEmailNotificationToggle
                                id="dailyNotificationsToggle"
                                className="mr-2"
                                isEnabled={isDailyEmailEnabled}
                                canEnable={canEnableDailyEmails}
                                onChange={handleChangeEmailNotify}
                            />
                            {!userLoading && showRecoveryEmailInput && (
                                <label htmlFor="dailyNotificationsToggle" className="flex-1">
                                    {c('Label').t`Allow notifications by email`}
                                </label>
                            )}
                        </div>
                    </SettingsLayoutRight>
                </SettingsLayout>
                <ToggleAssistantContainer />
            </SettingsSection>
        </>
    );
};

export default MessagesGeneralSection;
