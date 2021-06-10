import {
    SyncMultipleApiResponses,
    SyncMultipleApiResponse,
    DecryptedCalendarKey,
    ImportCalendarModel,
    StoredEncryptedEvent,
    VcalVeventComponent,
    EncryptedEvent,
} from '../../interfaces/calendar';
import { API_CODES, HOUR } from '../../constants';
import { CreateCalendarEventSyncData } from '../../interfaces/calendar/Api';
import { splitErrors } from './import';
import { IMPORT_EVENT_ERROR_TYPE, ImportEventError } from './ImportEventError';
import { syncMultipleEvents } from '../../api/calendars';
import { createCalendarEvent, getHasSharedEventContent, getHasSharedKeyPacket } from '../serialize';
import getCreationKeys from '../integration/getCreationKeys';
import { chunk } from '../../helpers/array';
import { wait } from '../../helpers/promise';
import { Api, DecryptedKey } from '../../interfaces';

const { SINGLE_SUCCESS } = API_CODES;
const BATCH_SIZE = 10;

const encryptEvent = async (
    eventComponent: VcalVeventComponent,
    addressKeys: DecryptedKey[],
    calendarKeys: DecryptedCalendarKey[]
) => {
    const uid = eventComponent.uid.value;
    try {
        const data = await createCalendarEvent({
            eventComponent,
            isCreateEvent: true,
            isSwitchCalendar: false,
            ...(await getCreationKeys({ addressKeys, newCalendarKeys: calendarKeys })),
        });
        if (!getHasSharedKeyPacket(data) || !getHasSharedEventContent(data)) {
            throw new Error('Missing shared data');
        }
        return { data, component: eventComponent };
    } catch (error) {
        return new ImportEventError(IMPORT_EVENT_ERROR_TYPE.ENCRYPTION_ERROR, uid, 'vevent');
    }
};

const submitEvents = async (events: EncryptedEvent[], calendarID: string, memberID: string, api: Api) => {
    // prepare the events data in the way the API wants it
    const Events = events.map(
        (event): CreateCalendarEventSyncData => ({
            Overwrite: 1,
            Event: { Permissions: 3, ...event.data },
        })
    );
    // submit the data
    let responses: SyncMultipleApiResponses[] = [];
    try {
        const { Responses } = await api<SyncMultipleApiResponse>({
            ...syncMultipleEvents(calendarID, { MemberID: memberID, IsImport: 1, Events }),
            timeout: HOUR,
            silence: true,
        });
        responses = Responses;
    } catch (error) {
        responses = events.map((event, index) => ({
            Index: index,
            Response: { Code: 0, Error: `${error}` },
        }));
    }

    return responses.map((response): StoredEncryptedEvent | ImportEventError => {
        const {
            Index,
            Response: { Error: errorMessage, Code },
        } = response;
        if (Code === SINGLE_SUCCESS) {
            return {
                ...events[Index],
                response,
            };
        }
        const error = new Error(errorMessage);
        const uid = events[Index]?.component.uid.value;
        return new ImportEventError(IMPORT_EVENT_ERROR_TYPE.EXTERNAL_ERROR, 'vevent', uid, error);
    });
};

interface ProcessData {
    events: VcalVeventComponent[];
    calendarID: string;
    memberID: string;
    addressKeys: DecryptedKey[];
    calendarKeys: DecryptedCalendarKey[];
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
    const imported: StoredEncryptedEvent[][] = [];

    for (let i = 0; i < batches.length; i++) {
        // The API requests limit for the submit route are 100 calls per 10 seconds
        // We play it safe by enforcing a 100ms minimum wait between API calls. During this wait we encrypt the events
        if (signal.aborted) {
            return [];
        }
        const batchedEvents = batches[i];
        const [result] = await Promise.all([
            Promise.all(batchedEvents.map((event) => encryptEvent(event, addressKeys, calendarKeys))),
            wait(300),
        ]);
        const { errors, rest: encrypted } = splitErrors(result);
        if (signal.aborted) {
            return [];
        }
        onProgress(encrypted, [], errors);
        if (encrypted.length) {
            const promise = submitEvents(encrypted, calendarID, memberID, api).then(
                (result: (StoredEncryptedEvent | ImportEventError)[]) => {
                    const { errors, rest: importedSuccess } = splitErrors(result);
                    imported.push(importedSuccess);
                    onProgress([], importedSuccess, errors);
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
