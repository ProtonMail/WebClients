import React, { useState, useEffect } from 'react';
import { c } from 'ttag';

import { Button } from '../../components';
import { useModals, useMailSettings } from '../../hooks';
import { SettingsSection } from '../account';

import ShortcutsToggle from './ShortcutsToggle';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import { MailShortcutsModal } from '../mail';

const AdvancedSection = () => {
    const { createModal } = useModals();

    const [{ Shortcuts = 0 } = {}] = useMailSettings();
    const [, setShortcuts] = useState(Shortcuts);

    const openShortcutsModal = () => {
        createModal(<MailShortcutsModal />, 'shortcuts-modal');
    };

    // Handle updates from the Event Manager.
    useEffect(() => {
        setShortcuts(Shortcuts);
    }, [Shortcuts]);

    return (
        <SettingsSection>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="shortcutsToggle" className="text-semibold">
                        {c('Title').t`Enable keyboard shortcuts`}
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="flex flex-item-fluid flex-justify-space-between flex-align-items-center">
                    <ShortcutsToggle className="mr1" id="shortcutsToggle" />
                    <Button
                        shape="outline"
                        onClick={openShortcutsModal}
                        className="flex-item-noshrink flex-item-nogrow"
                    >
                        {c('Action').t`Show shortcuts`}
                    </Button>
                </SettingsLayoutRight>
            </SettingsLayout>
        </SettingsSection>
    );
};

export default AdvancedSection;
