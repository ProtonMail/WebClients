import { useEffect, useState, MouseEvent } from 'react';
import { c } from 'ttag';

import { APPS } from '@proton/shared/lib/constants';

import { useModalState, SettingsLink } from '../../components';
import { useMailSettings, useUser } from '../../hooks';
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
    const [{ Shortcuts = 0 } = {}] = useMailSettings();
    const [, setShortcuts] = useState(Shortcuts);
    const [user, userLoading] = useUser();

    const [mailShortcutsProps, setMailShortcutsModalOpen] = useModalState();

    // Handle updates from the Event Manager.
    useEffect(() => {
        setShortcuts(Shortcuts);
    }, [Shortcuts]);

    const showDailyEmailNotificationSection = !userLoading && !user.isSubUser && user.isPrivate;

    const handleOpenShortcutsModal = (e: MouseEvent) => {
        e.preventDefault();
        setMailShortcutsModalOpen(true);
    };

    return (
        <>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="shortcutsToggle" className="flex-item-fluid">
                        <span className="pr0-5 text-semibold">{c('Title').t`Keyboard shortcuts`}</span>
                        <button type="button" onClick={handleOpenShortcutsModal}>
                            <Icon className="color-primary mb0-25" name="circle-info" size={16} />
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
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight className="pt0-5">
                        <DailyEmailNotificationToggleInput />
                        <SettingsLink className="ml0-5" path="/recovery" app={APPS.PROTONMAIL}>{c('Link')
                            .t`Set email address`}</SettingsLink>
                    </SettingsLayoutRight>
                </SettingsLayout>
            )}
            <MailShortcutsModal {...mailShortcutsProps} />
        </>
    );
};

export default MessagesGeneralSection;
