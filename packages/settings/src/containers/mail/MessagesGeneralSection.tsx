import { c } from 'ttag';

import { useUpdateAccountRecovery } from '@proton/account-recovery/recovery/useUpdateAccountRecovery';
import { useUser } from '@proton/account/user/hooks';
import { userSettingsActions } from '@proton/account/userSettings';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Href } from '@proton/atoms/Href/Href';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import { SettingsCardRows } from '@proton/components/containers/account/SettingsCardRows';
import { SettingsToggleRow } from '@proton/components/containers/account/SettingsToggleRow';
import ToggleAssistantContainer from '@proton/components/containers/general/ToggleAssistant/ToggleAssistantContainer';
import DailyEmailNotificationToggle from '@proton/components/containers/recovery/DailyEmailNotificationToggle';
import RecoveryEmail from '@proton/components/containers/recovery/email/RecoveryEmail';
import useAssistantFeatureEnabled from '@proton/components/hooks/assistant/useAssistantFeatureEnabled';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { patchNews } from '@proton/shared/lib/api/settings';
import { APPS, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import {
    NEWSLETTER_SUBSCRIPTIONS,
    NEWSLETTER_SUBSCRIPTIONS_BITS,
    getUpdatedNewsBitmap,
} from '@proton/shared/lib/helpers/newsletter';
import { getStaticURL } from '@proton/shared/lib/helpers/url';
import { SETTINGS_STATUS } from '@proton/shared/lib/interfaces/UserSettings';

const MessagesGeneralSection = () => {
    const [userSettings] = useUserSettings();
    const [user, userLoading] = useUser();
    const api = useApi();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const accountRecovery = useUpdateAccountRecovery();
    const assistantFeatureEnabled = useAssistantFeatureEnabled();

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
        const data = {
            [NEWSLETTER_SUBSCRIPTIONS.NEW_EMAIL_NOTIF]: !isDailyEmailEnabled,
        };
        dispatch(userSettingsActions.update({ UserSettings: { News: getUpdatedNewsBitmap(userSettings.News, data) } }));
        await api(patchNews(data));
    };

    return (
        <>
            {accountRecovery.el}
            <SettingsCardRows>
                <div className="flex flex-column gap-4">
                    <SettingsToggleRow
                        id="dailyNotificationsToggle"
                        label={
                            <>
                                <SettingsToggleRow.Label>{c('Label')
                                    .t`Daily email notifications`}</SettingsToggleRow.Label>
                                <SettingsToggleRow.Description>
                                    {c('Info')
                                        .t`When notifications are enabled, we'll send an alert to your recovery email address if you have new messages in your ${MAIL_APP_NAME} account.`}{' '}
                                    <Href href={getStaticURL('/support/notification-email')}>{c('Link')
                                        .t`Learn more`}</Href>
                                    {!userLoading && !showRecoveryEmailInput && (
                                        <>
                                            <br />
                                            <SettingsLink path="/recovery#account" app={APPS.PROTONMAIL}>
                                                {isDailyEmailEnabled &&
                                                userSettings?.Email?.Status === SETTINGS_STATUS.UNVERIFIED
                                                    ? c('Action').t`Requires a verified recovery email address`
                                                    : c('Link').t`Set email address`}
                                            </SettingsLink>
                                        </>
                                    )}
                                </SettingsToggleRow.Description>
                            </>
                        }
                        toggle={
                            <DailyEmailNotificationToggle
                                id="dailyNotificationsToggle"
                                isEnabled={isDailyEmailEnabled}
                                canEnable={canEnableDailyEmails}
                                onChange={handleChangeEmailNotify}
                            />
                        }
                    />
                    {!userLoading && showRecoveryEmailInput && (
                        <RecoveryEmail {...accountRecovery.recoveryEmail.props} />
                    )}
                </div>
                {assistantFeatureEnabled.enabled && <ToggleAssistantContainer />}
            </SettingsCardRows>
        </>
    );
};

export default MessagesGeneralSection;
