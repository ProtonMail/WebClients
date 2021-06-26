import React from 'react';
import { c } from 'ttag';

import { Button, Loader, Tooltip } from '../../../components';
import { useContacts, useModals, useUserKeys } from '../../../hooks';
import { SettingsSection, SettingsParagraph } from '../../account';

import ExportModal from './ExportModal';

const ExportSection = () => {
    const [contacts, loadingContacts] = useContacts();
    const { createModal } = useModals();
    const [userKeysList, loadingUserKeys] = useUserKeys();
    const handleExport = () => createModal(<ExportModal userKeysList={userKeysList} />);

    const hasNoContacts = !contacts?.length;

    const exportButton = (
        <Button color="norm" onClick={handleExport} disabled={hasNoContacts}>
            {c('Action').t`Export contacts`}
        </Button>
    );

    return (
        <SettingsSection>
            {loadingContacts || loadingUserKeys ? (
                <Loader />
            ) : (
                <>
                    <SettingsParagraph>
                        {c('Info')
                            .t`The application needs to locally decrypt your contacts before they can be exported. At the end of the process, a VCF file will be generated and you will be able to download it.`}
                    </SettingsParagraph>

                    <div className="mb1">
                        {hasNoContacts ? (
                            <Tooltip title={c('Tooltip').t`You do not have any contacts to export`}>
                                <span className="inline-block">{exportButton}</span>
                            </Tooltip>
                        ) : (
                            exportButton
                        )}
                    </div>
                </>
            )}
        </SettingsSection>
    );
};

export default ExportSection;
