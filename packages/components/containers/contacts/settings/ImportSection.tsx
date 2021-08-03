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
                    .t`We support importing CSV files from Outlook, Outlook Express, Yahoo! Mail, Hotmail, Eudora and some other apps. We also support importing vCard 4.0. (UTF-8 encoding).`}
            </SettingsParagraph>
            <div className="mb1">
                <Button color="norm" onClick={handleImport}>{c('Action').t`Import contacts`}</Button>
            </div>
        </SettingsSection>
    );
};

export default ImportSection;
