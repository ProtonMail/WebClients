import { c } from 'ttag';

import { Button } from '../../../components';
import { useModals } from '../../../hooks';
import { SettingsSection, SettingsParagraph } from '../../account';

import ImportModal from '../import/ImportModal';

const ImportSection = () => {
    const { createModal } = useModals();
    const handleImport = () => createModal(<ImportModal />);
    return (
        <SettingsSection>
            <SettingsParagraph>
                {c('Info')
                    .t`CSV files from Outlook, Outlook Express, Yahoo! Mail, Hotmail, Eudora and some other apps as well as vCard 3.1 and 4.0 formats (UTF-8 encoding) are supported.`}
            </SettingsParagraph>
            <div className="mb1">
                <Button color="norm" onClick={handleImport}>{c('Action').t`Import contacts`}</Button>
            </div>
        </SettingsSection>
    );
};

export default ImportSection;
