import { fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { CryptoProxy } from '@proton/crypto';
import partition from '@proton/utils/partition';
import unique from '@proton/utils/unique';

import { queryEvents } from '../../api/calendars';
import { SECOND } from '../../constants';
import formatUTC from '../../date-fns-utc/format';
import { WeekStartsOn } from '../../date-fns-utc/interface';
import {
    formatGMTOffsetAbbreviation,
    fromUTCDate,
    fromUTCDateToLocalFakeUTCDate,
    getTimezoneOffset,
} from '../../date/timezone';
import { wait } from '../../helpers/promise';
import { dateLocale } from '../../i18n';
import { Address, Api, Key } from '../../interfaces';
import {
    CalendarEvent,
    CalendarEventWithMetadata,
    EXPORT_EVENT_ERROR_TYPES,
    ExportError,
    VcalVeventComponent,
} from '../../interfaces/calendar';
import { CalendarExportEventsQuery } from '../../interfaces/calendar/Api';
import { GetAddressKeys } from '../../interfaces/hooks/GetAddressKeys';
import { GetCalendarEventPersonal } from '../../interfaces/hooks/GetCalendarEventPersonal';
import { GetCalendarKeys } from '../../interfaces/hooks/GetCalendarKeys';
import { withNormalizedAuthors } from '../author';
import { readCalendarEvent, readSessionKeys } from '../deserialize';
import { getTimezonedFrequencyString } from '../integration/getFrequencyString';
import { getCalendarEventDecryptionKeys } from '../keys/getCalendarEventDecryptionKeys';
import { fromRruleString } from '../vcal';
import { getDateProperty } from '../vcalConverter';
import { withSummary } from '../veventHelper';

export const getHasCalendarEventMatchingSigningKeys = async (event: CalendarEvent, keys: Key[]) => {
    const allEventSignatures = [...event.SharedEvents, ...event.CalendarEvents, ...event.AttendeesEvents].flatMap(
        (event) => (event.Signature ? [event.Signature] : [])
    );

    const allSignaturesKeyInfo = await Promise.all(
        allEventSignatures.map((armoredSignature) => CryptoProxy.getSignatureInfo({ armoredSignature }))
    );
    const allSigningKeyIDs = unique(allSignaturesKeyInfo.flatMap(({ signingKeyIDs }) => signingKeyIDs));
    for (const { PrivateKey: armoredKey } of keys) {
        const { keyIDs } = await CryptoProxy.getKeyInfo({ armoredKey });
        const isSigningKey = keyIDs.some((keyID) => allSigningKeyIDs.includes(keyID));

        if (isSigningKey) {
            return true;
        }
    }

    return false;
};

export interface GetErrorProps {
    event: CalendarEventWithMetadata;
    errorType: EXPORT_EVENT_ERROR_TYPES;
    weekStartsOn: WeekStartsOn;
    defaultTzid: string;
}

export const getError = ({ event, errorType, weekStartsOn, defaultTzid }: GetErrorProps): ExportError => {
    const { StartTime, RRule, FullDay } = event;
    const startDate = new Date(StartTime * SECOND);
    const fakeUTCStartDate = fromUTCDateToLocalFakeUTCDate(startDate, !!FullDay, defaultTzid);
    const startDateString = formatUTC(fakeUTCStartDate, FullDay ? 'P' : 'Pp', { locale: dateLocale });
    const { offset } = getTimezoneOffset(startDate, defaultTzid);
    const offsetString = formatGMTOffsetAbbreviation(offset);
    const timeString = `${startDateString}${FullDay ? '' : ` ${offsetString}`}`;

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
    getAddressKeys,
    getCalendarKeys,
    getCalendarEventPersonal,
    memberID,
}: {
    event: CalendarEventWithMetadata;
    addresses: Address[];
    getAddressKeys: GetAddressKeys;
    getCalendarKeys: GetCalendarKeys;
    getCalendarEventPersonal: GetCalendarEventPersonal;
    memberID: string;
    weekStartsOn: WeekStartsOn;
    defaultTzid: string;
}) => {
    const defaultParams = { event, defaultTzid, weekStartsOn };
    const [eventDecryptionKeys, eventPersonalMap] = await Promise.all([
        getCalendarEventDecryptionKeys({
            calendarEvent: event,
            getAddressKeys,
            getCalendarKeys,
        }),
        getCalendarEventPersonal(event),
    ]);

    try {
        const personalVevent = memberID ? eventPersonalMap[memberID] : undefined;
        const valarms = personalVevent ? personalVevent.veventComponent : {};

        const [sharedSessionKey, calendarSessionKey] = await readSessionKeys({
            calendarEvent: event,
            privateKeys: eventDecryptionKeys,
        });

        const { SharedEvents, CalendarEvents, AttendeesEvents, Attendees, AddressKeyPacket, AddressID } = event;
        const { veventComponent } = await readCalendarEvent({
            event: {
                SharedEvents: withNormalizedAuthors(SharedEvents),
                CalendarEvents: withNormalizedAuthors(CalendarEvents),
                AttendeesEvents: withNormalizedAuthors(AttendeesEvents),
                Attendees: Attendees,
            },
            sharedSessionKey,
            calendarSessionKey,
            addresses,
            encryptingAddressID: AddressKeyPacket && AddressID ? AddressID : undefined,
        });
        const veventWithAlarmsAndSummary: VcalVeventComponent = {
            ...valarms,
            // SUMMARY is mandatory in a PUBLISH ics
            ...withSummary(veventComponent),
        };

        return veventWithAlarmsAndSummary;
    } catch (error: any) {
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
    getAddressKeys: GetAddressKeys;
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
    getAddressKeys,
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
                    getAddressKeys,
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
