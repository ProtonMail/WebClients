import { ICAL_METHOD } from '@proton/shared/lib/calendar/constants';
import { ImportEventError } from '@proton/shared/lib/calendar/icsSurgery/ImportEventError';
import { processWithJails } from '@proton/shared/lib/calendar/import/encryptAndSubmit';
import {
    extractTotals,
    getSupportedEventsWithRecurrenceId,
    splitByRecurrenceId,
    splitErrors,
    splitHiddenErrors,
} from '@proton/shared/lib/calendar/import/import';
import { ImportFatalError } from '@proton/shared/lib/calendar/import/ImportFatalError';
import { getEventWithCalendarAlarms } from '@proton/shared/lib/calendar/integration/invite';

import {
    EncryptedEvent,
    IMPORT_STEPS,
    ImportCalendarModel,
    ImportedEvent,
} from '@proton/shared/lib/interfaces/calendar';
import { Dispatch, SetStateAction, useEffect } from 'react';
import { c } from 'ttag';

import { DynamicProgress } from '../../../components';
import { useApi, useBeforeUnload, useGetCalendarInfo } from '../../../hooks';

interface Props {
    model: ImportCalendarModel;
    setModel: Dispatch<SetStateAction<ImportCalendarModel>>;
    onFinish: (result: ImportedEvent[]) => void;
}
const ImportingModalContent = ({ model, setModel, onFinish }: Props) => {
    const api = useApi();
    const getCalendarInfo = useGetCalendarInfo();

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
            const { hidden: hiddenErrors, visible: visibleErrors } = splitHiddenErrors(errors);
            setModelWithAbort((model) => ({
                ...model,
                totalEncrypted: model.totalEncrypted + encrypted.length,
                totalImported: model.totalImported + imported.length,
                visibleErrors: [...model.visibleErrors, ...visibleErrors],
                hiddenErrors: [...model.hiddenErrors, ...hiddenErrors],
            }));
        };

        const process = async () => {
            try {
                const { memberID, addressKeys, calendarKeys, calendarSettings } = await getCalendarInfo(
                    model.calendar.ID
                );
                // add calendar alarms to invitations
                const vevents =
                    model.method !== ICAL_METHOD.PUBLISH
                        ? model.eventsParsed.map((vevent) => getEventWithCalendarAlarms(vevent, calendarSettings))
                        : [...model.eventsParsed];
                const { withoutRecurrenceId, withRecurrenceId } = splitByRecurrenceId(vevents);
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
                const { importedEvents } = await processWithJails(processData);
                const formattedEventsWithRecurrenceId = await getSupportedEventsWithRecurrenceId({
                    eventsWithRecurrenceId: withRecurrenceId,
                    parentEvents: importedEvents,
                    calendarId: model.calendar.ID,
                    api: apiWithAbort,
                });
                const { errors, rest: supportedEventsWithRecurrenceID } = splitErrors(formattedEventsWithRecurrenceId);
                handleImportProgress([], [], errors);
                const { importedEvents: recurrenceImportedEvents } = await processWithJails({
                    ...processData,
                    events: supportedEventsWithRecurrenceID,
                });
                if (signal.aborted) {
                    return;
                }
                onFinish([...importedEvents, ...recurrenceImportedEvents]);
            } catch (error: any) {
                setModelWithAbort((model) => ({
                    step: IMPORT_STEPS.ATTACHING,
                    calendar: model.calendar,
                    eventsParsed: [],
                    totalEncrypted: 0,
                    totalImported: 0,
                    visibleErrors: [],
                    hiddenErrors: [],
                    failure: new ImportFatalError(error),
                    loading: false,
                }));
                if (signal.aborted) {
                    return;
                }
                onFinish([]);
            }
        };

        void process();

        return () => {
            abortController.abort();
        };
    }, []);

    const { totalToImport, totalToProcess, totalImported, totalProcessed } = extractTotals(model);

    return (
        <>
            <div className="mb1">
                {c('Import calendar').t`Please don't close the tab before the importing process is finished.`}
            </div>
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
