import { c, msgid } from 'ttag';

import { extractTotals } from '@proton/shared/lib/calendar/import/import';
import { ImportCalendarModel } from '@proton/shared/lib/interfaces/calendar';

import { Alert, DynamicProgress } from '../../../components';
import ErrorDetails from './ErrorDetails';

interface Props {
    model: ImportCalendarModel;
}

const ImportSummaryModalContent = ({ model }: Props) => {
    const { totalToImport, totalToProcess, totalImported, totalProcessed } = extractTotals(model);
    const isSuccess = totalImported === totalToImport;
    const isPartialSuccess = totalImported > 0 && !isSuccess;

    const alertMessage = isSuccess
        ? c('Import calendar').ngettext(
              msgid`${totalImported} event successfully imported. The imported event will now appear in your calendar.`,
              `${totalImported} events successfully imported. The imported events will now appear in your calendar.`,
              totalImported
          )
        : isPartialSuccess
        ? c('Import calendar').ngettext(
              msgid`An error occurred while encrypting and adding your event. ${totalImported} out of ${totalToImport} event successfully imported.`,
              `An error occurred while encrypting and adding your events. ${totalImported} out of ${totalToImport} events successfully imported.`,
              totalToImport
          )
        : totalToImport === 1
        ? c('Import calendar').t`An error occurred while encrypting and adding your event. No event could be imported.`
        : // translator: the single version won't be used, it's only there for plural management. Please do keep the variable inside the translated version, otherwise our library will fail. Single version will be in another string: "An error occurred while encrypting and adding your event. No event could be imported."
          c('Import calendar').ngettext(
              msgid`An error occurred while encrypting and adding your ${totalToImport} event. No event could be imported.`,
              `An error occurred while encrypting and adding your ${totalToImport} events. No event could be imported.`,
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

    const getMessage = () => {
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
            {getMessage()}
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
