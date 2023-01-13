import { fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { CryptoProxy } from '@proton/crypto';
import { getIsAutoAddedInvite } from '@proton/shared/lib/calendar/apiModels';
import { getIsOwnedCalendar } from '@proton/shared/lib/calendar/calendar';
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
    CalendarSettings,
    EXPORT_EVENT_ERROR_TYPES,
    ExportError,
    VcalVeventComponent,
    VisualCalendar,
} from '../../interfaces/calendar';
import { CalendarExportEventsQuery } from '../../interfaces/calendar/Api';
import { GetAddressKeys } from '../../interfaces/hooks/GetAddressKeys';
import { GetCalendarKeys } from '../../interfaces/hooks/GetCalendarKeys';
import { withNormalizedAuthors } from '../author';
import { readCalendarEvent, readSessionKeys } from '../deserialize';
import { getCalendarEventDecryptionKeys } from '../keys/getCalendarEventDecryptionKeys';
import { getTimezonedFrequencyString } from '../recurrence/getFrequencyString';
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
    event: CalendarEvent;
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

const getDecryptionErrorType = async (event: CalendarEvent, keys: Key[]) => {
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
    calendarSettings,
    defaultTzid,
    weekStartsOn,
    addresses,
    getAddressKeys,
    getCalendarKeys,
}: {
    event: CalendarEvent;
    calendarSettings: CalendarSettings;
    addresses: Address[];
    getAddressKeys: GetAddressKeys;
    getCalendarKeys: GetCalendarKeys;
    weekStartsOn: WeekStartsOn;
    defaultTzid: string;
}) => {
    const defaultParams = { event, defaultTzid, weekStartsOn };
    const eventDecryptionKeys = await getCalendarEventDecryptionKeys({
        calendarEvent: event,
        getAddressKeys,
        getCalendarKeys,
    });

    try {
        const [sharedSessionKey, calendarSessionKey] = await readSessionKeys({
            calendarEvent: event,
            privateKeys: eventDecryptionKeys,
        });

        const {
            SharedEvents,
            CalendarEvents,
            AttendeesEvents,
            Attendees,
            PersonalEvents,
            Notifications,
            IsPersonalMigrated,
            FullDay,
        } = event;
        const { veventComponent } = await readCalendarEvent({
            event: {
                SharedEvents: withNormalizedAuthors(SharedEvents),
                CalendarEvents: withNormalizedAuthors(CalendarEvents),
                AttendeesEvents: withNormalizedAuthors(AttendeesEvents),
                Attendees,
                PersonalEvents,
                Notifications,
                IsPersonalMigrated,
                FullDay,
            },
            calendarSettings,
            sharedSessionKey,
            calendarSessionKey,
            addresses,
            encryptingAddressID: getIsAutoAddedInvite(event) ? event.AddressID : undefined,
        });

        // SUMMARY is mandatory in a PUBLISH ics
        return withSummary(veventComponent);
    } catch (error: any) {
        const inactiveKeys = addresses.flatMap(({ Keys }) => Keys.filter(({ Active }) => !Active));
        return getError({
            ...defaultParams,
            errorType: await getDecryptionErrorType(event, inactiveKeys),
        });
    }
};

interface ProcessData {
    calendar: VisualCalendar;
    addresses: Address[];
    getAddressKeys: GetAddressKeys;
    getCalendarKeys: GetCalendarKeys;
    api: Api;
    signal: AbortSignal;
    onProgress: (
        calendarEvents: CalendarEvent[],
        veventComponents: VcalVeventComponent[],
        exportErrors: ExportError[]
    ) => void;
    totalToProcess: number;
    calendarSettings: CalendarSettings;
    weekStartsOn: WeekStartsOn;
    defaultTzid: string;
}

export const processInBatches = async ({
    calendar,
    api,
    signal,
    onProgress,
    addresses,
    totalToProcess,
    getAddressKeys,
    getCalendarKeys,
    calendarSettings,
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
            api<{ Events: CalendarEvent[] }>(queryEvents(calendar.ID, params)),
            wait(DELAY),
        ]);

        // ignore auto-added invites in shared calendars (they can't be decrypted and we don't display them in the UI)
        const exportableEvents = getIsOwnedCalendar(calendar)
            ? Events
            : Events.filter(({ AddressKeyPacket }) => !AddressKeyPacket);
        if (signal.aborted) {
            return [[], [], totalToProcess];
        }
        onProgress(exportableEvents, [], []);

        const eventsLength = exportableEvents.length;

        lastId = exportableEvents[eventsLength - 1].ID;

        totalEventsFetched += eventsLength;

        const promise = Promise.all(
            exportableEvents.map((event) =>
                decryptEvent({
                    event,
                    calendarSettings,
                    defaultTzid,
                    weekStartsOn,
                    addresses,
                    getAddressKeys,
                    getCalendarKeys,
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
                const exportErrors: ExportError[] = exportableEvents.map(() => [
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
