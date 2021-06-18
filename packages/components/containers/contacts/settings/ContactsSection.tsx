import React from 'react';
import { c } from 'ttag';

import { Info } from '../../../components';
import { useMailSettings } from '../../../hooks';
import SettingsLayout from '../../account/SettingsLayout';
import SettingsLayoutLeft from '../../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../../account/SettingsLayoutRight';

import { AutoSaveContactsToggle } from '../../general';

const ContactsSection = () => {
    const [mailSettings] = useMailSettings();
    const { AutoSaveContacts } = mailSettings || {};
    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label htmlFor="saveContactToggle" data-testid="contacts:save-contact-label">
                    <span className="mr0-5 text-semibold">{c('Label').t`Automatically save contacts`}</span>
                    <Info url="https://protonmail.com/support/knowledge-base/autosave-contact-list/" />
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight className="pt0-5 relative">
                <AutoSaveContactsToggle autoSaveContacts={!!AutoSaveContacts} id="saveContactToggle" />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default ContactsSection;
