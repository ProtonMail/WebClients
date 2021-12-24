import { HTTP_ERROR_CODES } from '../../errors';
import {
    SyncMultipleApiResponses,
    SyncMultipleApiResponse,
    DecryptedCalendarKey,
    ImportedEvent,
    VcalVeventComponent,
    EncryptedEvent,
} from '../../interfaces/calendar';
import { HOUR, SECOND } from '../../constants';
import { CreateCalendarEventSyncData } from '../../interfaces/calendar/Api';
import { getIsSuccessSyncApiResponse } from '../helper';
import { getComponentIdentifier, splitErrors } from './import';
import { IMPORT_EVENT_ERROR_TYPE, ImportEventError } from '../icsSurgery/ImportEventError';
import { syncMultipleEvents } from '../../api/calendars';
import { createCalendarEvent, getHasSharedEventContent, getHasSharedKeyPacket } from '../serialize';
import getCreationKeys from '../integration/getCreationKeys';
import { chunk } from '../../helpers/array';
import { wait } from '../../helpers/promise';
import { Api, DecryptedKey } from '../../interfaces';

const BATCH_SIZE = 10;

const encryptEvent = async (
    eventComponent: VcalVeventComponent,
    addressKeys: DecryptedKey[],
    calendarKeys: DecryptedCalendarKey[]
) => {
    const componentId = getComponentIdentifier(eventComponent);
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
    } catch (error: any) {
        return new ImportEventError(IMPORT_EVENT_ERROR_TYPE.ENCRYPTION_ERROR, 'vevent', componentId);
    }
};

const submitEvents = async (
    events: EncryptedEvent[],
    calendarID: string,
    memberID: string,
    api: Api,
    overwrite?: 0 | 1,
    withJails?: boolean
) => {
    // prepare the events data in the way the API wants it
    const Events = events.map(
        (event): CreateCalendarEventSyncData => ({
            Overwrite: overwrite,
            Event: { Permissions: 1, ...event.data },
        })
    );
    // submit the data
    let responses: SyncMultipleApiResponses[];
    try {
        const { Responses } = await api<SyncMultipleApiResponse>({
            ...syncMultipleEvents(calendarID, { MemberID: memberID, IsImport: 1, Events }),
            timeout: HOUR,
            silence: true,
            ignoreHandler: withJails ? [HTTP_ERROR_CODES.TOO_MANY_REQUESTS] : undefined,
        });
        responses = Responses;
    } catch (error: any) {
        if (withJails && error?.status === HTTP_ERROR_CODES.TOO_MANY_REQUESTS) {
            throw error;
        }
        responses = events.map((event, index) => ({
            Index: index,
            Response: { Code: 0, Error: `${error}` },
        }));
    }
    return responses;
};

const processResponses = (responses: SyncMultipleApiResponses[], events: EncryptedEvent[]) => {
    return responses.map((response): ImportedEvent | ImportEventError => {
        const {
            Index,
            Response: { Error: errorMessage },
        } = response;
        if (getIsSuccessSyncApiResponse(response)) {
            return {
                ...events[Index],
                response,
            };
        }
        const error = new Error(errorMessage);
        const component = events[Index]?.component;
        const componentId = component ? getComponentIdentifier(component) : '';
        return new ImportEventError(IMPORT_EVENT_ERROR_TYPE.EXTERNAL_ERROR, 'vevent', componentId, error);
    });
};

interface ProcessData {
    events: VcalVeventComponent[];
    calendarID: string;
    memberID: string;
    addressKeys: DecryptedKey[];
    calendarKeys: DecryptedCalendarKey[];
    api: Api;
    overwrite?: 0 | 1;
    signal?: AbortSignal;
    onProgress?: (encrypted: EncryptedEvent[], imported: EncryptedEvent[], errors: ImportEventError[]) => void;
}

export const processInBatches = async ({
    events,
    calendarID,
    memberID,
    overwrite = 1,
    addressKeys,
    calendarKeys,
    api,
    signal,
    onProgress,
}: ProcessData) => {
    const batches = chunk(events, BATCH_SIZE);
    const promises = [];
    const imported: ImportedEvent[][] = [];
    const errored: ImportEventError[][] = [];

    for (let i = 0; i < batches.length; i++) {
        // The API requests limit for the submit route is 40 calls per 10 seconds
        // We play it safe by enforcing a 300ms minimum wait between API calls. During this wait we encrypt the events
        if (signal?.aborted) {
            return {
                importedEvents: [],
                importErrors: [],
            };
        }
        const batchedEvents = batches[i];
        const [result] = await Promise.all([
            Promise.all(batchedEvents.map((event) => encryptEvent(event, addressKeys, calendarKeys))),
            wait(300),
        ]);
        const { errors, rest: encrypted } = splitErrors(result);
        if (signal?.aborted) {
            return {
                importedEvents: [],
                importErrors: [],
            };
        }
        onProgress?.(encrypted, [], errors);
        if (errors.length) {
            errored.push(errors);
        }
        if (encrypted.length) {
            const promise = submitEvents(encrypted, calendarID, memberID, api, overwrite).then((responses) => {
                const processedResponses = processResponses(responses, encrypted);
                const { errors, rest: importedSuccess } = splitErrors(processedResponses);
                imported.push(importedSuccess);
                errored.push(errors);
                if (!signal?.aborted) {
                    onProgress?.([], importedSuccess, errors);
                }
            });
            promises.push(promise);
        }
    }
    await Promise.all(promises);

    return {
        importedEvents: imported.flat(),
        importErrors: errored.flat(),
    };
};

/**
 * The following helper works as follows:
 * * We encrypt and submit in parallel. As events are encrypted (in batches), they are moved to the import queue.
 * * Batches of encrypted events are submitted at a constant rate
 *   (which under normal circumstances should be jail-safe).
 * * If a jail is hit, all ongoing submissions are paused and we wait a retry-after period
 *   (defined as the max of all possible retry-after received from those submissions).
 * * The submission process is resumed at a lower rate
 * */
export const processWithJails = async ({
    events,
    calendarID,
    memberID,
    overwrite = 1,
    addressKeys,
    calendarKeys,
    api,
    signal,
    onProgress,
}: ProcessData) => {
    const queueToEncrypt = chunk(events, BATCH_SIZE);
    const queueToImport: EncryptedEvent[][] = [];
    const imported: ImportedEvent[][] = [];
    const errored: ImportEventError[][] = [];

    // The API requests limit for the submit route is normally 40 calls per 10 seconds
    // We start with a relax period that respects this limit.
    let relaxTime = 300;

    const encrypt = async () => {
        while (queueToEncrypt.length && !signal?.aborted) {
            const [eventsToEncrypt] = queueToEncrypt;
            const result = await Promise.all(
                eventsToEncrypt.map((event) => encryptEvent(event, addressKeys, calendarKeys))
            );
            queueToEncrypt.splice(0, 1);
            const { errors, rest: encrypted } = splitErrors(result);
            queueToImport.push(encrypted);
            if (!signal?.aborted) {
                onProgress?.(encrypted, [], errors);
            }
            if (errors.length) {
                errored.push(errors);
            }
        }
    };

    const submit = async (): Promise<void> => {
        let paused = false;
        const retryAfters: number[] = [];
        const promises = [];

        while ((queueToImport.length || queueToEncrypt.length) && !signal?.aborted && !paused) {
            const [eventsToImport] = queueToImport;
            if (!eventsToImport) {
                // encryption might not be finished yet, give it some time
                await wait(relaxTime);
                return submit();
            }
            queueToImport.splice(0, 1);
            promises.push(
                submitEvents(eventsToImport, calendarID, memberID, api, overwrite, true)
                    .then((responses) => {
                        const processedResponses = processResponses(responses, eventsToImport);
                        const { errors, rest: importedSuccess } = splitErrors(processedResponses);
                        imported.push(importedSuccess);
                        errored.push(errors);
                        if (!signal?.aborted) {
                            onProgress?.([], importedSuccess, errors);
                        }
                    })
                    // it should be safe to change the value of paused in this loop because it can only be changed to true
                    // eslint-disable-next-line @typescript-eslint/no-loop-func
                    .catch((error: any) => {
                        // the only error we can get here is the TOO_MANY_REQUESTS one. All others are caught by submitEvents
                        paused = true;
                        queueToImport.push(eventsToImport);
                        retryAfters.push(parseInt(error?.response?.headers.get('retry-after') || '0', 10) * SECOND);
                    })
            );

            await wait(relaxTime);
        }

        // wait until all ongoing promises are finished
        await Promise.all(promises);

        if (paused) {
            // A jail was hit. Wait for a safe retry after period, then resume the process at a lower rate
            await wait(Math.max(...retryAfters));
            relaxTime *= 1.5;
            return submit();
        }
    };

    await Promise.all([encrypt(), submit()]);

    return {
        importedEvents: imported.flat(),
        importErrors: errored.flat(),
    };
};
