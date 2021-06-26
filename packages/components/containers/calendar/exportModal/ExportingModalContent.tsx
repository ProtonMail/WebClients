import { processInBatches } from '@proton/shared/lib/calendar/export/export';
import React, { Dispatch, SetStateAction, useEffect } from 'react';
import { c } from 'ttag';

import {
    CalendarEventWithMetadata,
    EXPORT_ERRORS,
    EXPORT_STEPS,
    ExportCalendarModel,
    ExportError,
    VcalVeventComponent,
} from '@proton/shared/lib/interfaces/calendar';

import { getEventsCount } from '@proton/shared/lib/api/calendars';
import { Alert, DynamicProgress } from '../../../components';
import useGetCalendarEventPersonal from '../../../hooks/useGetCalendarEventPersonal';
import {
    useGetCalendarInfo,
    useApi,
    useGetAddresses,
    useGetCalendarKeys,
    useGetCalendarUserSettings,
} from '../../../hooks';

interface Props {
    model: ExportCalendarModel;
    setModel: Dispatch<SetStateAction<ExportCalendarModel>>;
    onFinish: (vevents: VcalVeventComponent[], exportErrors: ExportError[]) => void;
}
const ExportingModalContent = ({ model, setModel, onFinish }: Props) => {
    const api = useApi();
    const getAddresses = useGetAddresses();
    const getCalendarInfo = useGetCalendarInfo();
    const getCalendarEventPersonal = useGetCalendarEventPersonal();
    const getCalendarKeys = useGetCalendarKeys();
    const getCalendarUserSettings = useGetCalendarUserSettings();

    const { totalFetched, totalToProcess, totalProcessed, exportErrors } = model;
    const totalErrors = exportErrors.length;

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

        const handleExportProgress = (
            events: CalendarEventWithMetadata[],
            veventComponents: VcalVeventComponent[],
            exportErrors: ExportError[]
        ) => {
            setModelWithAbort((currentModel) => ({
                ...currentModel,
                totalFetched: currentModel.totalFetched + events.length,
                totalProcessed: currentModel.totalProcessed + veventComponents.length,
                exportErrors: [...currentModel.exportErrors, ...exportErrors],
            }));
        };

        const process = async () => {
            try {
                const [addresses, { memberID }, calendarUserSettings] = await Promise.all([
                    getAddresses(),
                    getCalendarInfo(model.calendar.ID),
                    getCalendarUserSettings(),
                ]);

                if (!addresses) {
                    throw new Error('No addresses');
                }

                const { Total: totalToProcess } = await api<{ Total: number }>(getEventsCount(model.calendar.ID));

                setModelWithAbort((currentModel) => ({
                    ...currentModel,
                    totalToProcess,
                }));

                const [exportedEvents, exportErrors, totalEventsFetched] = await processInBatches({
                    calendarID: model.calendar.ID,
                    addresses,
                    api: apiWithAbort,
                    signal,
                    onProgress: handleExportProgress,
                    getCalendarKeys,
                    getCalendarEventPersonal,
                    memberID,
                    totalToProcess,
                    weekStartsOn: model.weekStartsOn,
                    defaultTzid: calendarUserSettings.PrimaryTimezone,
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

                onFinish(exportedEvents, exportErrors);
            } catch (error) {
                setModelWithAbort((currentModel) => ({
                    ...currentModel,
                    step: EXPORT_STEPS.FINISHED,
                    totalProcessed: 0,
                    totalToProcess: 0,
                    exportErrors: [],
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

    const display = !totalProcessed
        ? c('Export calendar').t`Loading events`
        : c('Export calendar').t`Decrypting events from your calendar: ${totalProcessed}/${totalToProcess}`;

    return (
        <>
            <Alert>
                {c('Export calendar').t`Please don't close the tab before the exporting process is finished.`}
            </Alert>
            <DynamicProgress
                id="progress-export-calendar"
                value={totalFetched + totalProcessed + totalErrors}
                display={display}
                max={2 * totalToProcess}
                loading
            />
        </>
    );
};

export default ExportingModalContent;
