import React from 'react';
import { c, msgid } from 'ttag';
import { ImportCalendarModel } from '@proton/shared/lib/interfaces/calendar';
import { extractTotals } from '@proton/shared/lib/calendar/import/encryptAndSubmit';

import ErrorDetails from './ErrorDetails';
import { Alert, DynamicProgress } from '../../../components';

interface Props {
    model: ImportCalendarModel;
}

const ImportSummaryModalContent = ({ model }: Props) => {
    const { totalToImport, totalToProcess, totalImported, totalProcessed } = extractTotals(model);
    const isSuccess = totalImported === totalToImport;
    const isPartialSuccess = totalImported > 0 && !isSuccess;

    const alertMessage = isSuccess
        ? c('Import calendar').ngettext(
              msgid`Event successfully imported. The imported event will now appear in your calendar.`,
              `Events successfully imported. The imported events will now appear in your calendar.`,
              totalImported
          )
        : isPartialSuccess
        ? c('Import calendar')
              .t`An error occurred while encrypting and adding your events. ${totalImported} out of ${totalToImport} events successfully imported.`
        : c('Import calendar').ngettext(
              msgid`An error occurred while encrypting and adding your event. No event could be imported.`,
              `An error occurred while encrypting and adding your events. No event could be imported.`,
              totalToImport
          );
    const displayMessage =
        isPartialSuccess || isSuccess
            ? c('Import calendar').ngettext(
                  msgid`${totalImported}/${totalToImport} event encrypted and added to your calendar`,
                  `${totalImported}/${totalToImport} events encrypted and added to your calendar`,
                  totalToImport
              )
            : '';

    return (
        <>
            <Alert type={isSuccess ? 'info' : isPartialSuccess ? 'warning' : 'error'}>{alertMessage}</Alert>
            <DynamicProgress
                id="progress-import-calendar"
                value={totalProcessed}
                display={displayMessage}
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
