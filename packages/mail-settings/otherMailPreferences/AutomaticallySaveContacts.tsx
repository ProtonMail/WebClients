import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { SettingsToggleRow } from '@proton/components/containers/account/SettingsToggleRow';
import AutoSaveContactsToggle from '@proton/components/containers/general/AutoSaveContactsToggle';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

const AutomaticallySaveContacts = () => {
    const [mailSettings] = useMailSettings();
    const { AutoSaveContacts } = mailSettings || {};

    return (
        <SettingsToggleRow
            id="saveContactToggle"
            label={
                <>
                    <SettingsToggleRow.Label>{c('Label').t`Automatically save contacts`}</SettingsToggleRow.Label>
                    <SettingsToggleRow.Description>
                        <Href href={getKnowledgeBaseUrl('/autosave-contact-list')}>{c('Link').t`Learn more`}</Href>
                    </SettingsToggleRow.Description>
                </>
            }
            toggle={<AutoSaveContactsToggle autoSaveContacts={!!AutoSaveContacts} id="saveContactToggle" />}
        />
    );
};

export default AutomaticallySaveContacts;
