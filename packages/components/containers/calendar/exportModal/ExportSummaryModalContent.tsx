import React from 'react';
import { c, msgid } from 'ttag';

import {
    EXPORT_ERRORS,
    EXPORT_EVENT_ERROR_TYPES,
    ExportCalendarModel,
    ExportError,
} from '@proton/shared/lib/interfaces/calendar';

import { partition } from '@proton/shared/lib/helpers/array';
import { Alert, Bordered, Details, DynamicProgress, Href, Summary } from '../../../components';

const getErrorMessage = (hasMultiplePasswordResetErrors: boolean) => (type: EXPORT_EVENT_ERROR_TYPES) => {
    const errorMessagesMap: { [key in EXPORT_EVENT_ERROR_TYPES]: string } = {
        [EXPORT_EVENT_ERROR_TYPES.DECRYPTION_ERROR]: c('Export calendar').t`Error decrypting event`,
        [EXPORT_EVENT_ERROR_TYPES.PASSWORD_RESET]: hasMultiplePasswordResetErrors
            ? c('Export calendar').t`Password reset - multiple events cannot be decrypted`
            : c('Export calendar').t`Password reset - event cannot be decrypted`,
    };

    return errorMessagesMap[type];
};

interface Props {
    model: ExportCalendarModel;
}

const ExportSummaryModalContent = ({ model }: Props) => {
    const { totalFetched, totalProcessed, totalToProcess, exportErrors, error } = model;
    const isSuccess = totalProcessed === totalToProcess && error === undefined;
    const isPartialSuccess = totalProcessed > 0 && !isSuccess;
    const totalErrors = exportErrors.length;

    const displayMessage = c('Export calendar').ngettext(
        msgid`${totalProcessed}/${totalToProcess} event exported`,
        `${totalProcessed}/${totalToProcess} events exported`,
        totalToProcess
    );

    const [passwordResetErrors, otherErrors] = partition<ExportError>(
        exportErrors,
        (item): item is ExportError => item[1] === EXPORT_EVENT_ERROR_TYPES.PASSWORD_RESET
    );
    const hasMultiplePasswordResetErrors = passwordResetErrors.length > 1;
    const filteredErrors: ExportError[] = hasMultiplePasswordResetErrors
        ? [...otherErrors, ['', EXPORT_EVENT_ERROR_TYPES.PASSWORD_RESET]]
        : exportErrors;
    const hasOnlyPasswordResetErrors = passwordResetErrors.length === exportErrors.length;

    const kbLink = 'https://protonmail.com/support/knowledge-base/restoring-encrypted-calendar/';
    const getAlertMessage = () => {
        if (isSuccess) {
            return c('Export calendar').t`Calendar successfully exported. You can now save the ICS file.`;
        }

        if (isPartialSuccess) {
            if (hasOnlyPasswordResetErrors) {
                return (
                    <>
                        <div>
                            {c('Export calendar')
                                .t`Due to a password reset, some of your events could not be decrypted and exported.`}
                        </div>
                        <div>
                            {c('Export calendar')
                                .t`You can save an ICS file of the events that were successfully exported.`}
                        </div>
                        <div>
                            <Href url={kbLink}>{c('Export calendar')
                                .t`Learn how to restore encrypted events with old password`}</Href>
                        </div>
                    </>
                );
            }

            return (
                <>
                    <div>{c('Export calendar').t`Some of your events could not be exported.`}</div>
                    <div>{c('Export calendar')
                        .t`You can save an ICS file of the events that were successfully exported.`}</div>
                </>
            );
        }

        if (model.error === EXPORT_ERRORS.NETWORK_ERROR) {
            return c('Export calendar')
                .t`The internet connection was interrupted, causing the export process to fail. Please try again.`;
        }

        if (hasOnlyPasswordResetErrors) {
            return (
                <>
                    <div>
                        {c('Export calendar')
                            .t`Due to a password reset, none of your events could be decrypted and exported.`}
                    </div>
                    <div>
                        <a href={kbLink} target="_blank" rel="noreferrer noopener nofollow">{c('Export calendar')
                            .t`Learn how to restore encrypted events with old password`}</a>
                    </div>
                </>
            );
        }

        return c('Export calendar').t`None of the events could be exported.`;
    };

    const shouldShowErrorDetails = !!filteredErrors.length && !hasOnlyPasswordResetErrors;
    const getError = getErrorMessage(hasMultiplePasswordResetErrors);

    return (
        <>
            <Alert type={isSuccess ? 'info' : isPartialSuccess ? 'warning' : 'error'}>{getAlertMessage()}</Alert>
            <DynamicProgress
                id="progress-export-calendar"
                value={totalFetched + totalProcessed + totalErrors}
                display={displayMessage}
                max={2 * totalToProcess}
                loading={false}
                success={isSuccess}
                partialSuccess={isPartialSuccess}
            />
            {shouldShowErrorDetails && (
                <Details>
                    <Summary>{c('Summary of errors during export calendar')
                        .t`Details about events that couldn't be exported`}</Summary>
                    <Bordered>
                        {filteredErrors.map(([details, error], index) => (
                            <div key={index}>
                                {details && <span>{details}: </span>}
                                <span className="color-danger">{getError(error)}</span>
                            </div>
                        ))}
                    </Bordered>
                </Details>
            )}
        </>
    );
};

export default ExportSummaryModalContent;
