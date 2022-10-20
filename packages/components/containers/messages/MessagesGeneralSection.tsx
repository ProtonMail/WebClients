import { MouseEvent } from 'react';

import { c } from 'ttag';

import { APPS, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getStaticURL } from '@proton/shared/lib/helpers/url';
import { SETTINGS_STATUS } from '@proton/shared/lib/interfaces';

import { Info, SettingsLink, useModalState } from '../../components';
import Icon from '../../components/icon/Icon';
import { useUser, useUserSettings } from '../../hooks';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import SettingsSection from '../account/SettingsSection';
import ShortcutsToggle from '../general/ShortcutsToggle';
import { MailShortcutsModal } from '../mail';
import DailyEmailNotificationToggle from '../recovery/DailyEmailNotificationToggle';
import RecoveryEmail from '../recovery/email/RecoveryEmail';

const MessagesGeneralSection = () => {
    const [userSettings] = useUserSettings();
    const [user, userLoading] = useUser();

    const [mailShortcutsProps, setMailShortcutsModalOpen] = useModalState();

    const handleOpenShortcutsModal = (e: MouseEvent) => {
        e.preventDefault();
        setMailShortcutsModalOpen(true);
    };

    const showRecoveryEmailInput = !user.isPrivate;
    const isDailyEmailEnabled = !!userSettings?.Email?.Notify && !!userSettings?.Email?.Value;
    const canEnableDailyEmail = !!userSettings?.Email?.Value;

    return (
        <>
            <MailShortcutsModal {...mailShortcutsProps} />
            <SettingsSection>
                <SettingsLayout>
                    <SettingsLayoutLeft>
                        <label htmlFor="shortcutsToggle" className="flex-item-fluid">
                            <span className="pr0-5 text-semibold">{c('Title').t`Keyboard shortcuts`}</span>
                            <button type="button" onClick={handleOpenShortcutsModal}>
                                <Icon
                                    className="color-primary mb0-25"
                                    name="info-circle"
                                    alt={c('Action').t`More info: Keyboard shortcuts`}
                                    size={16}
                                />
                            </button>
                        </label>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight className="flex flex-item-fluid flex-align-items-center">
                        <ShortcutsToggle className="mr1" id="shortcutsToggle" />
                    </SettingsLayoutRight>
                </SettingsLayout>
                <SettingsLayout>
                    <SettingsLayoutLeft>
                        <label htmlFor="dailyNotificationsToggle" className="flex-item-fluid">
                            <span className="pr0-5 text-semibold">{c('Label').t`Daily email notifications`}</span>
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
                    <SettingsLayoutRight className="flex-item-fluid">
                        {!userLoading && showRecoveryEmailInput && (
                            <RecoveryEmail
                                className="mb0 on-mobile-mb1"
                                email={userSettings.Email}
                                hasReset={!!userSettings.Email.Reset}
                                hasNotify={!!userSettings.Email.Notify}
                            />
                        )}
                        <div className="flex flex-align-items-center">
                            <DailyEmailNotificationToggle
                                id="dailyNotificationsToggle"
                                className="mr0-5"
                                isEnabled={isDailyEmailEnabled}
                                canEnable={canEnableDailyEmail}
                            />
                            {!userLoading && showRecoveryEmailInput && (
                                <label htmlFor="dailyNotificationsToggle" className="flex-item-fluid">
                                    {c('Label').t`Allow notifications by email`}
                                </label>
                            )}
                        </div>
                    </SettingsLayoutRight>
                </SettingsLayout>
            </SettingsSection>
        </>
    );
};

export default MessagesGeneralSection;
