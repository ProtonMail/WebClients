import React from 'react';
import { c, msgid } from 'ttag';
import { ImportContactsModel } from '@proton/shared/lib/interfaces/contacts/Import';

import { Alert, DynamicProgress } from '../../../components';
import { extractTotals } from './encryptAndSubmit';
import ErrorDetails from './ErrorDetails';

interface Props {
    model: ImportContactsModel;
}
const ImportSummaryModalContent = ({ model }: Props) => {
    const { totalToImport, totalToProcess, totalImported, totalProcessed } = extractTotals(model);
    const isSuccess = totalImported === totalToImport;
    const isPartialSuccess = totalImported > 0 && !isSuccess;

    const alertMessage = isSuccess
        ? c('Import contacts').ngettext(
              msgid`Contact successfully imported. The imported contact will now appear in your contact list.`,
              `Contacts successfully imported. The imported contacts will now appear in your contact list.`,
              totalImported
          )
        : isPartialSuccess
        ? c('Import contacts')
              .t`An error occurred while encrypting and adding your contacts. ${totalImported} out of ${totalToImport} contacts successfully imported.`
        : c('Import contact').ngettext(
              msgid`An error occurred while encrypting and adding your contact. No contact could be imported.`,
              `An error occurred while encrypting and adding your contacts. No contact could be imported.`,
              totalToImport
          );
    const displayMessage = c('Import contact').ngettext(
        msgid`${totalImported}/${totalToImport} contact encrypted and added to your contact list`,
        `${totalImported}/${totalToImport} contacts encrypted and added to your contact list`,
        totalToImport
    );

    return (
        <>
            <Alert type={isSuccess ? 'info' : isPartialSuccess ? 'warning' : 'error'}>{alertMessage}</Alert>
            <DynamicProgress
                id="progress-import-contacts"
                value={totalProcessed}
                display={isPartialSuccess || isSuccess ? displayMessage : undefined}
                max={totalToProcess}
                loading={false}
                success={isSuccess}
                partialSuccess={isPartialSuccess}
            />
            <ErrorDetails errors={model.errors} />
        </>
    );
};

export default ImportSummaryModalContent;
