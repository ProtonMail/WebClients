import { wait } from 'proton-shared/lib/helpers/promise';
import { truncate } from 'proton-shared/lib/helpers/string';
import React, { useEffect, Dispatch, SetStateAction } from 'react';
import { c } from 'ttag';
import {
    useApi,
    useGetCalendarKeys,
    useGetAddressKeys,
    useGetAddresses,
    useGetCalendarBootstrap,
    Alert
} from 'react-components';
import { syncMultipleEvents } from 'proton-shared/lib/api/calendars';
import { createCalendarEvent } from 'proton-shared/lib/calendar/serialize';
import { chunk } from 'proton-shared/lib/helpers/array';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { CachedKey } from 'proton-shared/lib/interfaces';
import { MAX_UID_CHARS_DISPLAY } from '../../constants';
import getCreationKeys from '../../containers/calendar/getCreationKeys';
import getMemberAndAddress, { getMemberAndAddressID } from '../../helpers/getMemberAndAddress';
import useUnload from '../../hooks/useUnload';
import { IMPORT_STEPS, ImportCalendarModel, SyncMultipleApiResponse, Unwrap } from '../../interfaces/Import';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { API_CODES } from 'proton-shared/lib/constants';

import DynamicProgress from './DynamicProgress';
import { ImportFatalError } from './ImportFileError';

const { SINGLE_SUCCESS } = API_CODES;
const BATCH_SIZE = 10;

interface Props {
    model: ImportCalendarModel;
    setModel: Dispatch<SetStateAction<ImportCalendarModel>>;
    onFinish: () => void;
}
const ImportingModalContent = ({ model, setModel, onFinish }: Props) => {
    const api = useApi();
    const getCalendarBootstrap = useGetCalendarBootstrap();
    const getAddresses = useGetAddresses();
    const getCalendarKeys = useGetCalendarKeys();
    const getAddressKeys = useGetAddressKeys();

    const setModelWithAbort = (set: (model: ImportCalendarModel) => ImportCalendarModel, signal: AbortSignal) => {
        if (signal.aborted) {
            return;
        }
        setModel(set);
    };

    useUnload(c('Alert').t`By leaving now, some events may not be imported`);

    useEffect(() => {
        // Prepare api for allowing cancellation in the middle of the import
        const abortController = new AbortController();
        const apiWithAbort: <T>(config: object) => Promise<T> = (config) =>
            api({ ...config, signal: abortController.signal });

        const encryptEvent = async (
            eventComponent: VcalVeventComponent,
            addressKeys: CachedKey[],
            calendarKeys: CachedKey[]
        ) => {
            const uid = eventComponent.uid.value;
            try {
                const data = await createCalendarEvent({
                    eventComponent,
                    isSwitchCalendar: false,
                    ...(await getCreationKeys({ addressKeys, newCalendarKeys: calendarKeys }))
                });
                return { uid, data };
            } catch (error) {
                console.log(error);
                return { uid, error };
            }
        };

        const encryptEvents = async (
            events: VcalVeventComponent[],
            addressKeys: CachedKey[],
            calendarKeys: CachedKey[],
            signal: AbortSignal
        ) => {
            if (signal.aborted) {
                return [];
            }
            const results = await Promise.all(events.map((event) => encryptEvent(event, addressKeys, calendarKeys)));
            const encrypted = results.filter(({ error }) => !error).map(({ uid, data }) => ({ uid, data }));
            const notEncrypted = results
                .filter(({ error }) => !!error)
                .map(({ uid }) => {
                    const shortUID = truncate(uid, MAX_UID_CHARS_DISPLAY);
                    return {
                        idMessage: c('Error importing event').t`Event ${shortUID} could not be encrypted`,
                        errorMessage: c('Error importing event').t`Encryption error`
                    };
                });
            setModelWithAbort(
                (model) => ({
                    ...model,
                    eventsEncrypted: [...model.eventsEncrypted, ...encrypted],
                    eventsNotEncrypted: [...model.eventsNotEncrypted, ...notEncrypted]
                }),
                signal
            );
            return encrypted;
        };

        const submitEvents = async (
            encryptedEvents: Unwrap<typeof encryptEvent>[],
            memberID: string,
            batchIndex: number,
            signal: AbortSignal
        ) => {
            // filter out events that failed at encryption
            const events = encryptedEvents.filter(isTruthy);
            if (!events.length) {
                return;
            }
            // prepare the events data in the way the API wants it
            const Events = events.map((event) => ({ Event: { Permissions: 3, ...event.data } }));
            // submit the data
            const responses: { Code: number; Index: number; Error?: string }[] = [];
            try {
                const { Responses } = await apiWithAbort<SyncMultipleApiResponse>(
                    syncMultipleEvents(model.calendar.ID, { MemberID: memberID, Events })
                );
                Responses.forEach(({ Index, Response: { Code, Error } }) => {
                    responses.push({ Code, Index, Error });
                });
            } catch (error) {
                events.forEach((event, index) => {
                    responses.push({ Code: 0, Index: index, Error: error });
                });
            }

            // update the model according to the responses
            const imported = responses
                .filter(({ Code }) => Code === SINGLE_SUCCESS)
                .map(({ Index }) => ({ uid: events[Index].uid }));
            const notImported = responses
                .filter(({ Code }) => Code !== SINGLE_SUCCESS)
                .map(({ Index, Error }) => {
                    const shortUID = truncate(events[Index].uid, MAX_UID_CHARS_DISPLAY);
                    return {
                        idMessage: c('Error importing event').t`Event ${shortUID} could not be imported`,
                        errorMessage: Error || ''
                    };
                });
            setModelWithAbort(
                (model) => ({
                    ...model,
                    eventsImported: [...model.eventsImported, ...imported],
                    eventsNotImported: [...model.eventsNotImported, ...notImported]
                }),
                signal
            );
        };

        const getIdsAndKeys = async (calendarID: string) => {
            const [{ Members }, Addresses] = await Promise.all([getCalendarBootstrap(calendarID), getAddresses()]);
            const [memberID, addressID] = getMemberAndAddressID(getMemberAndAddress(Addresses, Members));
            const [addressKeys, calendarKeys] = await Promise.all([
                getAddressKeys(addressID),
                getCalendarKeys(calendarID)
            ]);
            return { memberID, addressKeys, calendarKeys };
        };

        /**
         * All steps of the import process
         */
        const process = async (signal: AbortSignal) => {
            try {
                const { memberID, addressKeys, calendarKeys } = await getIdsAndKeys(model.calendar.ID);
                const batches = chunk(model.eventsParsed, BATCH_SIZE);
                for (let i = 0; i < batches.length; i++) {
                    // The API requests limit for the submit route are 100 calls per 10 seconds
                    // We play it safe by enforcing a 100ms minimum wait between API calls. During this wait we encrypt the events
                    const [encryptedEvents] = await Promise.all([
                        encryptEvents(batches[i], addressKeys, calendarKeys, signal),
                        wait(100)
                    ]);
                    submitEvents(encryptedEvents, memberID, i, signal);
                }
            } catch (error) {
                setModelWithAbort(
                    (model) => ({
                        step: IMPORT_STEPS.ATTACHING,
                        calendar: model.calendar,
                        eventsParsed: [],
                        eventsNotParsed: [],
                        eventsEncrypted: [],
                        eventsNotEncrypted: [],
                        eventsImported: [],
                        eventsNotImported: [],
                        failure: new ImportFatalError(error)
                    }),
                    signal
                );
            }
        };

        process(abortController.signal);

        return () => {
            abortController.abort();
        };
    }, []);

    const total = model.eventsParsed.length;
    const encrypted = model.eventsEncrypted.length;
    const imported = model.eventsImported.length;
    const notImported = model.eventsNotEncrypted.length + model.eventsNotImported.length;
    const hasFinished = imported + notImported === total;

    useEffect(() => {
        if (hasFinished) {
            onFinish();
        }
    }, [hasFinished]);

    return (
        <>
            <Alert>
                {c('Import calendar').t`Please don't close the tab before the importing process is finished.`}
            </Alert>
            <DynamicProgress
                id="progress-import-calendar"
                value={encrypted + imported}
                display={c('Import calendar').t`Encrypting and adding events to your calendar: ${imported}/${total}`}
                max={2 * total} // count encryption and submission equivalently for the progress
                loading={true}
            />
        </>
    );
};

export default ImportingModalContent;
