import { CreateCalendarEventSyncData, syncMultipleEvents } from 'proton-shared/lib/api/calendars';
import { OVERWRITE_EVENT } from 'proton-shared/lib/calendar/constants';
import { createCalendarEvent } from 'proton-shared/lib/calendar/serialize';
import { API_CODES } from 'proton-shared/lib/constants';
import { chunk } from 'proton-shared/lib/helpers/array';
import { wait } from 'proton-shared/lib/helpers/promise';
import { Api, CachedKey } from 'proton-shared/lib/interfaces';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { HOUR } from '../../constants';
import getCreationKeys from '../../containers/calendar/getCreationKeys';
import { splitErrors } from '../../helpers/import';
import { EncryptedEvent, ImportCalendarModel, SyncMultipleApiResponse } from '../../interfaces/Import';
import { IMPORT_EVENT_TYPE, ImportEventError } from './ImportEventError';

const { SINGLE_SUCCESS } = API_CODES;
const BATCH_SIZE = 10;

export const encryptEvent = async (
    eventComponent: VcalVeventComponent,
    addressKeys: CachedKey[],
    calendarKeys: CachedKey[]
) => {
    const uid = eventComponent.uid.value;
    try {
        const data = await createCalendarEvent({
            eventComponent,
            isSwitchCalendar: false,
            ...(await getCreationKeys({ addressKeys, newCalendarKeys: calendarKeys })),
        });
        return { data, component: eventComponent };
    } catch (error) {
        return new ImportEventError(IMPORT_EVENT_TYPE.ENCRYPTION_ERROR, uid, 'vevent');
    }
};

export const submitEvents = async (events: EncryptedEvent[], calendarID: string, memberID: string, api: Api) => {
    // prepare the events data in the way the API wants it
    const Events = events.map(
        (event): CreateCalendarEventSyncData => ({
            Overwrite: OVERWRITE_EVENT.YES,
            Event: { Permissions: 3, ...event.data },
        })
    );
    // submit the data
    const responses: { Code: number; Index: number; Error?: string }[] = [];
    try {
        const { Responses } = await api<SyncMultipleApiResponse>({
            ...syncMultipleEvents(calendarID, { MemberID: memberID, Events }),
            timeout: HOUR * 1000,
            silence: true,
        });
        Responses.forEach(({ Index, Response: { Code, Error } }) => {
            responses.push({ Code, Index, Error });
        });
    } catch (error) {
        events.forEach((event, index) => {
            responses.push({ Code: 0, Index: index, Error: error });
        });
    }

    return responses.map(({ Code, Index, Error: errorMessage }) => {
        if (Code === SINGLE_SUCCESS) {
            return events[Index];
        }
        const error = new Error(errorMessage);
        const uid = events[Index]?.component.uid.value;
        return new ImportEventError(IMPORT_EVENT_TYPE.EXTERNAL_ERROR, 'vevent', uid, error);
    });
};

interface ProcessData {
    events: VcalVeventComponent[];
    calendarID: string;
    memberID: string;
    addressKeys: CachedKey[];
    calendarKeys: CachedKey[];
    api: Api;
    signal: AbortSignal;
    onProgress: (encrypted: EncryptedEvent[], imported: EncryptedEvent[], errors: ImportEventError[]) => void;
}
export const processInBatches = async ({
    events,
    calendarID,
    memberID,
    addressKeys,
    calendarKeys,
    api,
    signal,
    onProgress,
}: ProcessData) => {
    const batches = chunk(events, BATCH_SIZE);
    const promises = [];
    const imported: EncryptedEvent[][] = [];
    for (let i = 0; i < batches.length; i++) {
        // The API requests limit for the submit route are 100 calls per 10 seconds
        // We play it safe by enforcing a 100ms minimum wait between API calls. During this wait we encrypt the events
        if (signal.aborted) {
            return [];
        }
        const batchedEvents = batches[i];
        const [result] = await Promise.all([
            Promise.all(batchedEvents.map((event) => encryptEvent(event, addressKeys, calendarKeys))),
            wait(100),
        ]);
        const { errors, rest: encrypted } = splitErrors(result);
        if (signal.aborted) {
            return [];
        }
        onProgress(encrypted, [], errors);
        if (encrypted.length) {
            const promise = submitEvents(encrypted, calendarID, memberID, api).then(
                (result: (EncryptedEvent | ImportEventError)[]) => {
                    const { errors, rest: submitted } = splitErrors(result);
                    imported.push(submitted);
                    onProgress([], submitted, errors);
                }
            );
            promises.push(promise);
        }
    }
    await Promise.all(promises);

    return imported.flat();
};

export const extractTotals = (model: ImportCalendarModel) => {
    const { eventsParsed, totalEncrypted, totalImported, errors } = model;
    const totalToImport = eventsParsed.length;
    const totalToProcess = 2 * totalToImport; // count encryption and submission equivalently for the progress
    const totalErrors = errors.length;
    const totalProcessed = totalEncrypted + totalImported + totalErrors;
    return { totalToImport, totalToProcess, totalImported, totalProcessed };
};
