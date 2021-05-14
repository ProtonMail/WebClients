import { c } from 'ttag';
import { arrayToHexString, binaryStringToArray, getKeys, getSignature } from 'pmcrypto';
import { fromUnixTime } from 'date-fns';
import { CalendarExportEventsQuery, queryEvents } from '../../api/calendars';
import { wait } from '../../helpers/promise';
import { partition, unique } from '../../helpers/array';
import { Address, Api, Key } from '../../interfaces';
import {
    CalendarEvent,
    CalendarEventWithMetadata,
    EXPORT_EVENT_ERROR_TYPES,
    ExportError,
    VcalVeventComponent,
} from '../../interfaces/calendar';
import { GetCalendarEventPersonal } from '../../interfaces/hooks/GetCalendarEventPersonal';
import { GetCalendarKeys } from '../../interfaces/hooks/GetCalendarKeys';
import { splitKeys } from '../../keys';
import { withNormalizedAuthors } from '../author';
import { readCalendarEvent, readSessionKeys } from '../deserialize';
import { fromRruleString } from '../vcal';
import { getTimezonedFrequencyString } from '../integration/getFrequencyString';
import { getDateProperty } from '../vcalConverter';
import {
    convertUTCDateTimeToZone,
    formatGMTOffsetAbbreviation,
    fromUTCDate,
    getTimezoneOffset,
    toUTCDate,
} from '../../date/timezone';
import { dateLocale } from '../../i18n';
import { WeekStartsOn } from '../../date-fns-utc/interface';
import { SECOND } from '../../constants';
import formatUTC from '../../date-fns-utc/format';

export const getHasCalendarEventMatchingSigningKeys = async (event: CalendarEvent, keys: Key[]) => {
    // OpenPGP types are broken
    const allEventSignatures = [
        ...event.SharedEvents,
        ...event.CalendarEvents,
        ...event.AttendeesEvents,
    ].flatMap((event) => (event.Signature ? [event.Signature] : []));

    const allSignaturesPromises = Promise.all(allEventSignatures.map((signature) => getSignature(signature)));
    const allKeyIdsPromises = Promise.all(
        keys.map(async (key) => {
            const [signingKey] = await getKeys(key.PrivateKey);
            // @ts-ignore
            return arrayToHexString(binaryStringToArray(signingKey.getKeyId().bytes as string));
        })
    );
    const [allSignatures, allKeyIds] = await Promise.all([allSignaturesPromises, allKeyIdsPromises]);
    const allSignatureKeyIds: string[] = unique(
        // @ts-ignore
        allSignatures.flatMap((signature) => signature.packets.map(({ issuerKeyId }) => issuerKeyId.toHex()))
    );
    return allSignatureKeyIds.some((id) => allKeyIds.includes(id));
};

export interface GetErrorProps {
    event: CalendarEventWithMetadata;
    errorType: EXPORT_EVENT_ERROR_TYPES;
    weekStartsOn: WeekStartsOn;
    defaultTzid: string;
}

export const getError = ({ event, errorType, weekStartsOn, defaultTzid }: GetErrorProps): ExportError => {
    const { StartTime, RRule } = event;
    const startDate = new Date(StartTime * SECOND);
    const fakeUTCStartDate = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(startDate), defaultTzid));
    const startDateString = formatUTC(fakeUTCStartDate, 'Pp', { locale: dateLocale });
    const { offset } = getTimezoneOffset(startDate, defaultTzid);
    const offsetString = formatGMTOffsetAbbreviation(offset);
    const timeString = `${startDateString} ${offsetString}`;

    const rruleValueFromString = RRule ? fromRruleString(RRule) : undefined;
    const utcStartDate = fromUnixTime(StartTime);
    const dtstart = getDateProperty(fromUTCDate(utcStartDate));

    if (rruleValueFromString) {
        const rruleString = getTimezonedFrequencyString({ value: rruleValueFromString }, dtstart, {
            currentTzid: defaultTzid,
            locale: dateLocale,
            weekStartsOn,
        });

        return [c('Error when exporting event from calendar').t`Event from ${timeString}, ${rruleString}`, errorType];
    }

    return [c('Error when exporting event from calendar').t`Event @ ${timeString}`, errorType];
};

const getDecryptionErrorType = async (event: CalendarEventWithMetadata, keys: Key[]) => {
    try {
        const HasMatchingKeys = await getHasCalendarEventMatchingSigningKeys(event, keys);
        if (HasMatchingKeys) {
            return EXPORT_EVENT_ERROR_TYPES.PASSWORD_RESET;
        }
        return EXPORT_EVENT_ERROR_TYPES.DECRYPTION_ERROR;
    } catch {
        return EXPORT_EVENT_ERROR_TYPES.DECRYPTION_ERROR;
    }
};

const decryptEvent = async ({
    event,
    defaultTzid,
    weekStartsOn,
    addresses,
    getCalendarKeys,
    getCalendarEventPersonal,
    memberID,
}: {
    event: CalendarEventWithMetadata;
    addresses: Address[];
    getCalendarKeys: GetCalendarKeys;
    getCalendarEventPersonal: GetCalendarEventPersonal;
    memberID: string;
    weekStartsOn: WeekStartsOn;
    defaultTzid: string;
}) => {
    const defaultParams = { event, defaultTzid, weekStartsOn };
    const [calendarKeys, eventPersonalMap] = await Promise.all([
        getCalendarKeys(event.CalendarID),
        getCalendarEventPersonal(event),
    ]);

    try {
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
            addresses,
        });
        const veventWithAlarms: VcalVeventComponent = {
            ...valarms,
            ...veventComponent,
        };

        return veventWithAlarms;
    } catch (error) {
        const inactiveKeys = addresses.flatMap(({ Keys }) => Keys.filter(({ Active }) => !Active));
        return getError({
            ...defaultParams,
            errorType: await getDecryptionErrorType(event, inactiveKeys),
        });
    }
};

interface ProcessData {
    calendarID: string;
    addresses: Address[];
    getCalendarKeys: GetCalendarKeys;
    getCalendarEventPersonal: GetCalendarEventPersonal;
    api: Api;
    signal: AbortSignal;
    onProgress: (
        calendarEvents: CalendarEventWithMetadata[],
        veventComponents: VcalVeventComponent[],
        exportErrors: ExportError[]
    ) => void;
    totalToProcess: number;
    memberID: string;
    weekStartsOn: WeekStartsOn;
    defaultTzid: string;
}

export const processInBatches = async ({
    calendarID,
    api,
    signal,
    onProgress,
    addresses,
    getCalendarEventPersonal,
    totalToProcess,
    memberID,
    getCalendarKeys,
    weekStartsOn,
    defaultTzid,
}: ProcessData): Promise<[VcalVeventComponent[], ExportError[], number]> => {
    const PAGE_SIZE = 10;
    const DELAY = 100;
    const batchesLength = Math.ceil(totalToProcess / PAGE_SIZE);
    const processed: VcalVeventComponent[] = [];
    const errors: ExportError[] = [];
    const promises: Promise<void>[] = [];
    let totalEventsFetched = 0;

    let lastId;

    for (let i = 0; i < batchesLength; i++) {
        if (signal.aborted) {
            return [[], [], totalToProcess];
        }

        const params: CalendarExportEventsQuery = {
            PageSize: PAGE_SIZE,
            BeginID: lastId,
        };

        const [{ Events }] = await Promise.all([
            api<{ Events: CalendarEventWithMetadata[] }>(queryEvents(calendarID, params)),
            wait(DELAY),
        ]);

        if (signal.aborted) {
            return [[], [], totalToProcess];
        }
        onProgress(Events, [], []);

        const { length: eventsLength } = Events;

        lastId = Events[eventsLength - 1].ID;

        totalEventsFetched += eventsLength;

        const promise = Promise.all(
            Events.map((event) =>
                decryptEvent({
                    event,
                    defaultTzid,
                    weekStartsOn,
                    addresses,
                    getCalendarKeys,
                    getCalendarEventPersonal,
                    memberID,
                })
            )
        )
            .then((veventsOrErrors) => {
                const [veventComponents, exportErrors] = partition<VcalVeventComponent, ExportError>(
                    veventsOrErrors,
                    (item): item is VcalVeventComponent => !Array.isArray(item)
                );

                processed.push(...veventComponents);
                errors.push(...exportErrors);
                onProgress([], veventComponents, exportErrors);
            })
            .catch((e) => {
                const exportErrors: ExportError[] = Events.map(() => [
                    e.message,
                    EXPORT_EVENT_ERROR_TYPES.DECRYPTION_ERROR,
                ]);
                errors.push(...exportErrors);
                onProgress([], [], exportErrors);
            });

        promises.push(promise);
    }

    await Promise.all(promises);

    return [processed, errors, totalEventsFetched];
};
