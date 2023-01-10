import { c, msgid } from 'ttag';

import { extractTotals } from '@proton/shared/lib/calendar/import/import';
import { ImportCalendarModel } from '@proton/shared/lib/interfaces/calendar';

import { Alert, DynamicProgress } from '../../../components';
import ErrorDetails from './ErrorDetails';

interface GetMessageParams {
    isSuccess: boolean;
    isPartialSuccess: boolean;
    totalImported: number;
    totalToImport: number;
}

const getAlertMessage = ({ isSuccess, isPartialSuccess, totalImported, totalToImport }: GetMessageParams) => {
    if (isSuccess) {
        return totalImported === 1
            ? c('Import calendar').t`Event successfully imported. The imported event will now appear in your calendar.`
            : // translator: "Events" below is meant as multiple (more than one) events generically. The exact number of events imported is mentioned elsewhere
              c('Import calendar')
                  .t`Events successfully imported. The imported events will now appear in your calendar.`;
    }
    if (isPartialSuccess) {
        return c('Import calendar').ngettext(
            msgid`An error occurred while encrypting and adding your event. ${totalImported} out of ${totalToImport} event successfully imported.`,
            `An error occurred while encrypting and adding your events. ${totalImported} out of ${totalToImport} events successfully imported.`,
            totalToImport
        );
    }
    return totalImported === 1
        ? c('Import calendar').t`An error occurred while encrypting and adding your event. No event could be imported.`
        : // translator: "Events" below is meant as multiple (more than one) events generically. The exact number of events we tried to import is mentioned elsewhere
          c('Import calendar')
              .t`An error occurred while encrypting and adding your events. No event could be imported.`;
};

const getDisplayMessage = ({ isSuccess, isPartialSuccess, totalImported, totalToImport }: GetMessageParams) => {
    if (!isSuccess && !isPartialSuccess) {
        return '';
    }
    return c('Import calendar').ngettext(
        msgid`${totalImported}/${totalToImport} event encrypted and added to your calendar`,
        `${totalImported}/${totalToImport} events encrypted and added to your calendar`,
        totalToImport
    );
};

interface Props {
    model: ImportCalendarModel;
}

const ImportSummaryModalContent = ({ model }: Props) => {
    const { totalToImport, totalToProcess, totalImported, totalProcessed } = extractTotals(model);
    const isSuccess = totalImported === totalToImport;
    const isPartialSuccess = totalImported > 0 && !isSuccess;

    const alertMessage = getAlertMessage({ isSuccess, isPartialSuccess, totalImported, totalToImport });
    const displayMessage = getDisplayMessage({ isSuccess, isPartialSuccess, totalImported, totalToImport });

    const getAlert = () => {
        if (isSuccess) {
            return <div className="mb1">{alertMessage}</div>;
        }

        return (
            <Alert className="mb1" type={isPartialSuccess ? 'warning' : 'error'}>
                {alertMessage}
            </Alert>
        );
    };

    return (
        <>
            {getAlert()}
            <DynamicProgress
                id="progress-import-calendar"
                value={totalProcessed}
                display={displayMessage}
                max={totalToProcess}
                loading={false}
                success={isSuccess}
                partialSuccess={isPartialSuccess}
            />
            <ErrorDetails errors={model.visibleErrors} />
        </>
    );
};

export default ImportSummaryModalContent;
