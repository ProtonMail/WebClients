import { fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { CryptoProxy } from '@proton/crypto';
import { withSupportedSequence } from '@proton/shared/lib/calendar/icsSurgery/vevent';
import isTruthy from '@proton/utils/isTruthy';
import partition from '@proton/utils/partition';
import unique from '@proton/utils/unique';

import { getEvent, queryEventsIDs } from '../../api/calendars';
import { getSilentApi } from '../../api/helpers/customConfig';
import { SECOND } from '../../constants';
import formatUTC from '../../date-fns-utc/format';
import type { WeekStartsOn } from '../../date-fns-utc/interface';
import {
    formatGMTOffsetAbbreviation,
    fromUTCDate,
    fromUTCDateToLocalFakeUTCDate,
    getTimezoneOffset,
} from '../../date/timezone';
import { dateLocale } from '../../i18n';
import type { Address, Api, Key } from '../../interfaces';
import type { VerificationPreferences } from '../../interfaces/VerificationPreferences';
import type {
    CalendarEvent,
    CalendarSettings,
    ExportError,
    VcalVeventComponent,
    VisualCalendar,
} from '../../interfaces/calendar';
import { EXPORT_EVENT_ERROR_TYPES } from '../../interfaces/calendar';
import type { CalendarEventsIDsQuery } from '../../interfaces/calendar/Api';
import type { GetAddressKeys } from '../../interfaces/hooks/GetAddressKeys';
import type { GetCalendarKeys } from '../../interfaces/hooks/GetCalendarKeys';
import { getIsAutoAddedInvite } from '../apiModels';
import { withNormalizedAuthors } from '../author';
import { getIsOwnedCalendar } from '../calendar';
import { getCalendarEventDecryptionKeys } from '../crypto/keys/helpers';
import { readCalendarEvent, readSessionKeys } from '../deserialize';
import { getTimezonedFrequencyString } from '../recurrence/getFrequencyString';
import { fromRruleString } from '../vcal';
import { getDateProperty } from '../vcalConverter';
import { withMandatoryPublishFields } from '../veventHelper';

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
    calendarEmail,
    calendarSettings,
    defaultTzid,
    weekStartsOn,
    addresses,
    getAddressKeys,
    getCalendarKeys,
    getAttendeeVerificationPreferences,
}: {
    event: CalendarEvent;
    calendarEmail: string;
    calendarSettings: CalendarSettings;
    addresses: Address[];
    getAddressKeys: GetAddressKeys;
    getCalendarKeys: GetCalendarKeys;
    weekStartsOn: WeekStartsOn;
    defaultTzid: string;
    getAttendeeVerificationPreferences: (attendeeEmail: string) => Promise<VerificationPreferences>;
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
            CalendarID,
            ID,
            SharedEvents,
            UID,
            CalendarEvents,
            AttendeesEvents,
            Notifications,
            FullDay,
            AttendeesInfo,
        } = event;

        const { veventComponent } = await readCalendarEvent({
            event: {
                SharedEvents: withNormalizedAuthors(SharedEvents),
                CalendarEvents: withNormalizedAuthors(CalendarEvents),
                AttendeesEvents: withNormalizedAuthors(AttendeesEvents),
                AttendeesInfo,
                Notifications,
                FullDay,
                CalendarID,
                ID,
                UID,
                // do not export color
                Color: null,
            },
            calendarSettings,
            sharedSessionKey,
            calendarSessionKey,
            addresses,
            encryptingAddressID: getIsAutoAddedInvite(event) ? event.AddressID : undefined,
            getAttendeeVerificationPreferences,
        });

        return withSupportedSequence(withMandatoryPublishFields(veventComponent, calendarEmail));
    } catch (error: any) {
        const inactiveKeys = addresses.flatMap(({ Keys }) => Keys.filter(({ Active }) => !Active));
        return getError({
            ...defaultParams,
            errorType: await getDecryptionErrorType(event, inactiveKeys),
        });
    }
};

const tryDecryptEvent = async ({
    calendar,
    event,
    calendarSettings,
    defaultTzid,
    weekStartsOn,
    addresses,
    getAddressKeys,
    getCalendarKeys,
    getAttendeeVerificationPreferences,
}: {
    calendar: VisualCalendar;
    event: CalendarEvent;
    calendarSettings: CalendarSettings;
    addresses: Address[];
    getAddressKeys: GetAddressKeys;
    getCalendarKeys: GetCalendarKeys;
    weekStartsOn: WeekStartsOn;
    defaultTzid: string;
    getAttendeeVerificationPreferences: (attendeeEmail: string) => Promise<VerificationPreferences>;
}) => {
    // ignore auto-added invites in shared calendars (they can't be decrypted and we don't display them in the UI)
    if (!getIsOwnedCalendar(calendar) && getIsAutoAddedInvite(event)) {
        return null;
    }
    return decryptEvent({
        event,
        calendarEmail: calendar.Email,
        calendarSettings,
        defaultTzid,
        weekStartsOn,
        addresses,
        getAddressKeys,
        getCalendarKeys,
        getAttendeeVerificationPreferences,
    });
};

const fetchAndTryDecryptEvent = async ({
    api,
    eventID,
    calendar,
    calendarSettings,
    defaultTzid,
    weekStartsOn,
    addresses,
    getAddressKeys,
    getCalendarKeys,
    getAttendeeVerificationPreferences,
}: {
    api: Api;
    eventID: string;
    calendar: VisualCalendar;
    calendarSettings: CalendarSettings;
    addresses: Address[];
    getAddressKeys: GetAddressKeys;
    getCalendarKeys: GetCalendarKeys;
    weekStartsOn: WeekStartsOn;
    defaultTzid: string;
    getAttendeeVerificationPreferences: (attendeeEmail: string) => Promise<VerificationPreferences>;
}) => {
    const { Event: event } = await getSilentApi(api)<{ Event: CalendarEvent }>(getEvent(calendar.ID, eventID));
    return tryDecryptEvent({
        event,
        calendar,
        calendarSettings,
        defaultTzid,
        weekStartsOn,
        addresses,
        getAddressKeys,
        getCalendarKeys,
        getAttendeeVerificationPreferences,
    });
};

interface ProcessData {
    calendar: VisualCalendar;
    addresses: Address[];
    getAddressKeys: GetAddressKeys;
    getCalendarKeys: GetCalendarKeys;
    api: Api;
    signal: AbortSignal;
    onProgress: (
        calendarEventIDs: string[],
        veventComponents: VcalVeventComponent[],
        exportErrors: ExportError[]
    ) => void;
    totalToProcess: number;
    calendarSettings: CalendarSettings;
    weekStartsOn: WeekStartsOn;
    defaultTzid: string;
    getAttendeeVerificationPreferences: (attendeeEmail: string) => Promise<VerificationPreferences>;
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
    getAttendeeVerificationPreferences,
}: ProcessData): Promise<[VcalVeventComponent[], ExportError[], number]> => {
    const PAGE_SIZE = 100;
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

        const params: CalendarEventsIDsQuery = {
            Limit: PAGE_SIZE,
            AfterID: lastId,
        };

        const IDs = (await api<{ IDs: string[] }>(queryEventsIDs(calendar.ID, params))).IDs;

        if (signal.aborted) {
            return [[], [], totalToProcess];
        }

        onProgress(IDs, [], []);

        lastId = IDs[IDs.length - 1];
        totalEventsFetched += IDs.length;

        const promise = Promise.all(
            IDs.map((eventID) =>
                fetchAndTryDecryptEvent({
                    api,
                    eventID,
                    calendar,
                    calendarSettings,
                    defaultTzid,
                    weekStartsOn,
                    addresses,
                    getAddressKeys,
                    getCalendarKeys,
                    getAttendeeVerificationPreferences,
                })
            )
        )
            .then((veventsOrErrors) => {
                const veventsOrErrorsNonNull: (VcalVeventComponent | ExportError)[] = veventsOrErrors.filter(isTruthy);
                const [veventComponents, exportErrors] = partition<VcalVeventComponent, ExportError>(
                    veventsOrErrorsNonNull,
                    (item): item is VcalVeventComponent => !Array.isArray(item)
                );

                processed.push(...veventComponents);
                errors.push(...exportErrors);
                onProgress([], veventComponents, exportErrors);
            })
            .catch((e) => {
                const exportErrors: ExportError[] = IDs.map(() => [
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
