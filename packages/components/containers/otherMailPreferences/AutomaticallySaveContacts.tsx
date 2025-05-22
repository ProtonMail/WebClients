import { c } from 'ttag';

import Info from '@proton/components/components/link/Info';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import AutoSaveContactsToggle from '@proton/components/containers/general/AutoSaveContactsToggle';
import { useMailSettings } from '@proton/mail/mailSettings/hooks';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

const AutomaticallySaveContacts = () => {
    const [mailSettings] = useMailSettings();
    const { AutoSaveContacts } = mailSettings || {};

    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label htmlFor="saveContactToggle">
                    <span className="mr-2 text-semibold">{c('Label').t`Automatically save contacts`}</span>
                </label>
                <Info url={getKnowledgeBaseUrl('/autosave-contact-list')} />
            </SettingsLayoutLeft>
            <SettingsLayoutRight isToggleContainer>
                <AutoSaveContactsToggle autoSaveContacts={!!AutoSaveContacts} id="saveContactToggle" />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default AutomaticallySaveContacts;
