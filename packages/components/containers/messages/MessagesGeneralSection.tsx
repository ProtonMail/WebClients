import { MouseEvent } from 'react';
import { c } from 'ttag';

import { SETTINGS_STATUS } from '@proton/shared/lib/interfaces';
import { APPS } from '@proton/shared/lib/constants';

import { useModalState, SettingsLink } from '../../components';
import { useUser, useUserSettings } from '../../hooks';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import ShortcutsToggle from '../general/ShortcutsToggle';
import { MailShortcutsModal } from '../mail';
import {
    DailyEmailNotificationToggleInput,
    DailyEmailNotificationToggleLabel,
} from '../recovery/DailyEmailNotificationToggle';
import Icon from '../../components/icon/Icon';

const MessagesGeneralSection = () => {
    const [userSettings] = useUserSettings();
    const [user, userLoading] = useUser();

    const [mailShortcutsProps, setMailShortcutsModalOpen] = useModalState();

    const showDailyEmailNotificationSection = !userLoading && !user.isSubUser && user.isPrivate;

    const handleOpenShortcutsModal = (e: MouseEvent) => {
        e.preventDefault();
        setMailShortcutsModalOpen(true);
    };

    const isDailyEmailEnabled = !!userSettings?.Email?.Notify && !!userSettings?.Email?.Value;
    const canEnableDailyEmail = !!userSettings?.Email?.Value;

    return (
        <>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="shortcutsToggle" className="flex-item-fluid">
                        <span className="pr0-5 text-semibold">{c('Title').t`Keyboard shortcuts`}</span>
                        <button type="button" onClick={handleOpenShortcutsModal}>
                            <Icon className="color-primary mb0-25" name="info-circle" size={16} />
                        </button>
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="flex flex-item-fluid flex-align-items-center">
                    <ShortcutsToggle className="mr1" id="shortcutsToggle" />
                </SettingsLayoutRight>
            </SettingsLayout>
            {showDailyEmailNotificationSection && (
                <SettingsLayout>
                    <SettingsLayoutLeft>
                        <DailyEmailNotificationToggleLabel />
                        <div className="text-sm">
                            <SettingsLink path="/recovery#account" app={APPS.PROTONMAIL}>
                                {isDailyEmailEnabled && userSettings?.Email?.Status === SETTINGS_STATUS.UNVERIFIED
                                    ? c('Action').t`Requires a verified recovery email address`
                                    : c('Link').t`Set email address`}
                            </SettingsLink>{' '}
                        </div>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight className="pt0-5">
                        <DailyEmailNotificationToggleInput
                            isEnabled={isDailyEmailEnabled}
                            canEnable={canEnableDailyEmail}
                        />
                    </SettingsLayoutRight>
                </SettingsLayout>
            )}
            <MailShortcutsModal {...mailShortcutsProps} />
        </>
    );
};

export default MessagesGeneralSection;
