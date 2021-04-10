import React from 'react';
import { c } from 'ttag';

import { Button } from '../../../components';
import { useModals, useUserKeys } from '../../../hooks';
import { SettingsSection, SettingsParagraph } from '../../account';

import ExportModal from './ExportModal';

const ExportSection = () => {
    const { createModal } = useModals();
    const [userKeysList, loadingUserKeys] = useUserKeys();
    const handleExport = () => createModal(<ExportModal userKeysList={userKeysList} />);
    return (
        <SettingsSection>
            <SettingsParagraph>
                {c('Info')
                    .t`The application needs to locally decrypt your contacts before they can be exported. At the end of the process, a VCF file will be generated and you will be able to download it.`}
            </SettingsParagraph>
            <div className="mb1">
                <Button color="norm" onClick={handleExport} disabled={loadingUserKeys}>
                    {c('Action').t`Export contacts`}
                </Button>
            </div>
        </SettingsSection>
    );
};

export default ExportSection;
