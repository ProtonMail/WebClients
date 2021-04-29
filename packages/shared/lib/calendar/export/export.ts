import { CalendarExportEventsQuery, queryEvents } from '../../api/calendars';
import { wait } from '../../helpers/promise';
import { Address, Api, DecryptedKey } from '../../interfaces';
import { CalendarEvent, VcalVeventComponent } from '../../interfaces/calendar';
import { GetCalendarKeys } from '../../interfaces/hooks/GetCalendarKeys';
import { GetEncryptionPreferences } from '../../interfaces/hooks/GetEncryptionPreferences';
import { splitKeys } from '../../keys';
import { getAuthorPublicKeysMap, withNormalizedAuthors } from '../author';
import { readCalendarEvent, readSessionKeys } from '../deserialize';

interface ProcessData {
    calendarID: string;
    addresses: Address[];
    getAddressKeys: (id: string) => Promise<DecryptedKey[]>;
    getEncryptionPreferences: GetEncryptionPreferences;
    getCalendarKeys: GetCalendarKeys;
    getCalendarEventPersonal: Function;
    api: Api;
    signal: AbortSignal;
    onProgress: (veventComponents: VcalVeventComponent[]) => void;
    totalToProcess: number;
    memberID: string;
}

export const processInBatches = async ({
    calendarID,
    api,
    signal,
    onProgress,
    addresses,
    getAddressKeys,
    getEncryptionPreferences,
    getCalendarEventPersonal,
    totalToProcess,
    memberID,
    getCalendarKeys,
}: ProcessData): Promise<[VcalVeventComponent[], CalendarEvent[], number]> => {
    const PAGE_SIZE = 10;
    const DELAY = 100;
    const batchesLength = Math.ceil(totalToProcess / PAGE_SIZE);
    const processed: VcalVeventComponent[] = [];
    const errored: CalendarEvent[] = [];
    const promises: Promise<void>[] = [];
    let totalEventsFetched = 0;

    let lastId;

    const decryptEvent = async (event: CalendarEvent) => {
        try {
            const [calendarKeys, publicKeysMap, eventPersonalMap] = await Promise.all([
                getCalendarKeys(event.CalendarID),
                getAuthorPublicKeysMap({
                    event,
                    addresses,
                    getAddressKeys,
                    getEncryptionPreferences,
                }),
                getCalendarEventPersonal(event),
            ]);

            const personalVevent = memberID ? eventPersonalMap[memberID] : undefined;
            const valarms = personalVevent ? personalVevent.veventComponent : {};

            const [sharedSessionKey, calendarSessionKey] = await readSessionKeys({
                calendarEvent: event,
                ...splitKeys(calendarKeys),
            });

            const { veventComponent } = await readCalendarEvent({
                isOrganizer: !!event.IsOrganizer,
                event: {
                    SharedEvents: withNormalizedAuthors(event.SharedEvents),
                    CalendarEvents: withNormalizedAuthors(event.CalendarEvents),
                    AttendeesEvents: withNormalizedAuthors(event.AttendeesEvents),
                    Attendees: event.Attendees,
                },
                sharedSessionKey,
                calendarSessionKey,
                publicKeysMap,
                addresses,
            });
            const veventWithAlarms = {
                ...valarms,
                ...veventComponent,
            };

            processed.push(veventWithAlarms);

            return veventWithAlarms;
        } catch (error) {
            errored.push(event);

            return null;
        }
    };

    for (let i = 0; i < batchesLength; i++) {
        if (signal.aborted) {
            return [[], [], totalToProcess];
        }

        const params: CalendarExportEventsQuery = {
            PageSize: PAGE_SIZE,
            BeginID: lastId,
        };

        const [{ Events }] = await Promise.all([
            api<{ Events: CalendarEvent[] }>(queryEvents(calendarID, params)),
            wait(DELAY),
        ]);

        if (signal.aborted) {
            return [[], [], totalToProcess];
        }

        const { length: eventsLength } = Events;

        lastId = Events[eventsLength - 1].ID;

        totalEventsFetched += eventsLength;

        const promise = Promise.all(Events.map(decryptEvent)).then((veventComponents) => {
            onProgress(
                veventComponents.filter((veventComponent): veventComponent is VcalVeventComponent => !!veventComponent)
            );
        });

        promises.push(promise);
    }

    await Promise.all(promises);

    return [processed, errored, totalEventsFetched];
};
