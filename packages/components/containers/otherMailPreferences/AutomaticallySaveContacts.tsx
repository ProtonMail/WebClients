import { c } from 'ttag';

import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import Info from '../../components/link/Info';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import AutoSaveContactsToggle from '../general/AutoSaveContactsToggle';

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
