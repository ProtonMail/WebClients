import React from 'react';
import { c, msgid } from 'ttag';

import { EXPORT_ERRORS, ExportCalendarModel } from 'proton-shared/lib/interfaces/calendar';

import { Alert, DynamicProgress } from '../../../components';

interface Props {
    model: ExportCalendarModel;
}

const ExportSummaryModalContent = ({ model }: Props) => {
    const { totalProcessed, totalToProcess, error } = model;
    const isSuccess = totalProcessed.length === totalToProcess && error === undefined;
    const isPartialSuccess = totalProcessed.length > 0 && !isSuccess;

    const getAlertMessage = () => {
        if (isSuccess) {
            return c('Export calendar').t`Calendar successfully exported. You can now save the ICS file.`;
        }

        if (isPartialSuccess) {
            return (
                <>
                    <div>{c('Export calendar').t`Some events could not be exported.`}</div>
                    <div>{c('Export calendar')
                        .t`You can save an ICS file of the events that were successfully exported.`}</div>
                </>
            );
        }

        if (model.error === EXPORT_ERRORS.NETWORK_ERROR) {
            return c('Export calendar')
                .t`The internet connection was interrupted, causing the export process to fail. Please try again.`;
        }

        return c('Export calendar').t`None of the events could be exported.`;
    };
    const displayMessage = c('Export calendar').ngettext(
        msgid`${totalProcessed.length}/${totalToProcess} event exported`,
        `${totalProcessed.length}/${totalToProcess} events exported`,
        totalProcessed.length
    );

    return (
        <>
            <Alert type={isSuccess ? 'info' : isPartialSuccess ? 'warning' : 'error'}>{getAlertMessage()}</Alert>
            <DynamicProgress
                id="progress-export-calendar"
                value={totalProcessed.length}
                display={displayMessage}
                max={totalToProcess}
                loading={false}
                success={isSuccess}
                partialSuccess={isPartialSuccess}
            />
        </>
    );
};

export default ExportSummaryModalContent;
