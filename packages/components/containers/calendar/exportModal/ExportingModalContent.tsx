import { processInBatches } from 'proton-shared/lib/calendar/export/export';
import React, { Dispatch, SetStateAction, useEffect } from 'react';
import { c } from 'ttag';

import {
    CalendarEvent,
    EXPORT_ERRORS,
    EXPORT_STEPS,
    ExportCalendarModel,
    VcalVeventComponent,
} from 'proton-shared/lib/interfaces/calendar';

import { getEventsCount } from 'proton-shared/lib/api/calendars';
import { Alert, DynamicProgress } from '../../../components';
import { useApi, useGetAddresses, useGetAddressKeys, useGetCalendarKeys } from '../../../hooks';
import useGetEncryptionPreferences from '../../../hooks/useGetEncryptionPreferences';

interface Props {
    model: ExportCalendarModel;
    setModel: Dispatch<SetStateAction<ExportCalendarModel>>;
    onFinish: (vevents: VcalVeventComponent[], erroredEvents: CalendarEvent[]) => void;
}
const ExportingModalContent = ({ model, setModel, onFinish }: Props) => {
    const api = useApi();
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();
    const getEncryptionPreferences = useGetEncryptionPreferences();
    const getCalendarKeys = useGetCalendarKeys();

    const { totalToProcess } = model;

    useEffect(() => {
        // Prepare api for allowing cancellation in the middle of the export
        const abortController = new AbortController();
        const { signal } = abortController;

        const apiWithAbort: <T>(config: object) => Promise<T> = (config) => api({ ...config, signal });

        const setModelWithAbort = (set: (currentModel: ExportCalendarModel) => ExportCalendarModel) => {
            if (signal.aborted) {
                return;
            }
            setModel(set);
        };

        const handleExportProgress = (veventComponents: VcalVeventComponent[]) => {
            if (!veventComponents.length) {
                return;
            }

            setModelWithAbort((currentModel) => ({
                ...currentModel,
                totalProcessed: [...currentModel.totalProcessed, ...veventComponents],
            }));
        };

        const process = async () => {
            try {
                const addresses = await getAddresses();

                if (!addresses) {
                    throw new Error('No addresses');
                }

                const { Total: totalToProcess } = await api<{ Total: number }>(getEventsCount(model.calendar.ID));

                setModelWithAbort((currentModel) => ({
                    ...currentModel,
                    totalToProcess,
                }));

                const [exportedEvents, erroredEvents, totalEventsFetched] = await processInBatches({
                    calendarID: model.calendar.ID,
                    addresses,
                    api: apiWithAbort,
                    signal,
                    onProgress: handleExportProgress,
                    getAddressKeys,
                    getEncryptionPreferences,
                    getCalendarKeys,
                    totalToProcess,
                });

                if (totalToProcess !== totalEventsFetched) {
                    setModelWithAbort((currentModel) => ({
                        ...currentModel,
                        totalToProcess: totalEventsFetched,
                    }));
                }

                if (signal.aborted) {
                    return;
                }

                onFinish(exportedEvents, erroredEvents);
            } catch (error) {
                setModelWithAbort((currentModel) => ({
                    step: EXPORT_STEPS.FINISHED,
                    calendar: currentModel.calendar,
                    totalProcessed: [],
                    totalToProcess: 0,
                    erroredEvents: [],
                    error: EXPORT_ERRORS.NETWORK_ERROR,
                }));

                if (signal.aborted) {
                    return;
                }

                onFinish([], []);
            }
        };

        process();

        return () => {
            abortController.abort();
        };
    }, []);

    const display = !model.totalProcessed.length
        ? c('Export calendar').t`Loading events`
        : c('Export calendar')
              .t`Decrypting events from your calendar: ${model.totalProcessed.length}/${totalToProcess}`;

    return (
        <>
            <Alert>
                {c('Export calendar').t`Please don't close the tab before the exporting process is finished.`}
            </Alert>
            <DynamicProgress
                id="progress-export-calendar"
                value={model.totalProcessed.length}
                display={display}
                max={totalToProcess}
                loading
            />
        </>
    );
};

export default ExportingModalContent;
