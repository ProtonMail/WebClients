import React, { Dispatch, SetStateAction, useEffect } from 'react';
import { c } from 'ttag';

import {
    EncryptedEvent,
    IMPORT_STEPS,
    ImportCalendarModel,
    StoredEncryptedEvent,
} from 'proton-shared/lib/interfaces/calendar';
import { ImportEventError } from 'proton-shared/lib/calendar/ImportEventError';
import {
    getSupportedEventsWithRecurrenceId,
    splitByRecurrenceId,
    splitErrors,
} from 'proton-shared/lib/calendar/import';
import { ImportFatalError } from 'proton-shared/lib/calendar/ImportFatalError';
import { extractTotals, processInBatches } from 'proton-shared/lib/calendar/encryptAndSubmit';

import { Alert, DynamicProgress } from '../../../components';
import { useApi, useBeforeUnload, useGetCalendarInfo } from '../../../hooks';

interface Props {
    model: ImportCalendarModel;
    setModel: Dispatch<SetStateAction<ImportCalendarModel>>;
    onFinish: (result: StoredEncryptedEvent[]) => void;
}
const ImportingModalContent = ({ model, setModel, onFinish }: Props) => {
    const api = useApi();
    const getIdsAndKeys = useGetCalendarInfo();

    useBeforeUnload(c('Alert').t`By leaving now, some events may not be imported`);

    useEffect(() => {
        // Prepare api for allowing cancellation in the middle of the import
        const abortController = new AbortController();
        const { signal } = abortController;

        const apiWithAbort: <T>(config: object) => Promise<T> = (config) => api({ ...config, signal });

        const setModelWithAbort = (set: (model: ImportCalendarModel) => ImportCalendarModel) => {
            if (signal.aborted) {
                return;
            }
            setModel(set);
        };

        const handleImportProgress = (
            encrypted: EncryptedEvent[],
            imported: EncryptedEvent[],
            errors: ImportEventError[]
        ) => {
            setModelWithAbort((model) => ({
                ...model,
                totalEncrypted: model.totalEncrypted + encrypted.length,
                totalImported: model.totalImported + imported.length,
                errors: [...model.errors, ...errors],
            }));
        };

        const process = async () => {
            try {
                const { memberID, addressKeys, calendarKeys } = await getIdsAndKeys(model.calendar.ID);
                const { withoutRecurrenceId, withRecurrenceId } = splitByRecurrenceId(model.eventsParsed);
                const processData = {
                    events: withoutRecurrenceId,
                    calendarID: model.calendar.ID,
                    memberID,
                    addressKeys,
                    calendarKeys,
                    api: apiWithAbort,
                    signal,
                    onProgress: handleImportProgress,
                };
                const importedEvents = await processInBatches(processData);
                const formattedEventsWithRecurrenceId = await getSupportedEventsWithRecurrenceId({
                    eventsWithRecurrenceId: withRecurrenceId,
                    parentEvents: importedEvents,
                    calendarId: model.calendar.ID,
                    api: apiWithAbort,
                });
                const { errors, rest: supportedEventsWithRecurrenceID } = splitErrors(formattedEventsWithRecurrenceId);
                handleImportProgress([], [], errors);
                const recurrenceImportedEvents = await processInBatches({
                    ...processData,
                    events: supportedEventsWithRecurrenceID,
                });
                if (signal.aborted) {
                    return;
                }
                onFinish([...importedEvents, ...recurrenceImportedEvents]);
            } catch (error) {
                setModelWithAbort((model) => ({
                    step: IMPORT_STEPS.ATTACHING,
                    calendar: model.calendar,
                    eventsParsed: [],
                    totalEncrypted: 0,
                    totalImported: 0,
                    errors: [],
                    failure: new ImportFatalError(error),
                    loading: false,
                }));
                if (signal.aborted) {
                    return;
                }
                onFinish([]);
            }
        };

        process();

        return () => {
            abortController.abort();
        };
    }, []);

    const { totalToImport, totalToProcess, totalImported, totalProcessed } = extractTotals(model);

    return (
        <>
            <Alert>
                {c('Import calendar').t`Please don't close the tab before the importing process is finished.`}
            </Alert>
            <DynamicProgress
                id="progress-import-calendar"
                value={totalProcessed}
                display={c('Import calendar')
                    .t`Encrypting and adding events to your calendar: ${totalImported}/${totalToImport}`}
                max={totalToProcess}
                loading
            />
        </>
    );
};

export default ImportingModalContent;
