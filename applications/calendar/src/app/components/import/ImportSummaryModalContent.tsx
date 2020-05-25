import React from 'react';
import { c, msgid } from 'ttag';
import { Alert } from 'react-components';
import { ImportCalendarModel } from '../../interfaces/Import';

import DynamicProgress from './DynamicProgress';
import ErrorDetails from './ErrorDetails';

interface Props {
    model: ImportCalendarModel;
}
const ImportSummaryModalContent = ({ model }: Props) => {
    const total = model.eventsParsed.length;
    const encrypted = model.eventsEncrypted.length;
    const imported = model.eventsImported.length;
    const success = imported === total;
    const partialSuccess = imported > 0 && !success;

    const errors = [...model.eventsNotEncrypted, ...model.eventsNotImported].map((e, index) => {
        const error = (
            // eslint-disable-next-line react/no-array-index-key
            <span key={index} className="color-global-warning">
                {e.message}
            </span>
        );
        const message = e.idMessage ? c('Error importing event').jt`${e.idMessage}. ${error}` : error;
        return {
            index,
            message,
        };
    });

    const alertMessage = success
        ? c('Import calendar').ngettext(
              msgid`Event successfully imported. The imported event will now appear in your calendar.`,
              `Events successfully imported. The imported events will now appear in your calendar.`,
              imported
          )
        : partialSuccess
        ? c('Import calendar')
              .t`An error occurred while encrypting and adding your events. ${imported} out of ${total} events successfully imported.`
        : c('Import calendar').ngettext(
              msgid`An error occurred while encrypting and adding your event. No event could be imported.`,
              `An error occurred while encrypting and adding your events. No event could be imported.`,
              total
          );
    const displayMessage = c('Import calendar').ngettext(
        msgid`${imported}/${total} event encrypted and added to your calendar`,
        `${imported}/${total} events encrypted and added to your calendar`,
        total
    );

    return (
        <>
            <Alert type={success ? 'info' : partialSuccess ? 'warning' : 'error'}>{alertMessage}</Alert>
            <DynamicProgress
                id="progress-import-calendar"
                value={encrypted + imported}
                display={displayMessage}
                max={2 * total} // count encryption and submission equivalently for the progress
                loading={false}
                success={success}
                partialSuccess={partialSuccess}
            />
            <ErrorDetails errors={errors} />
        </>
    );
};

export default ImportSummaryModalContent;
