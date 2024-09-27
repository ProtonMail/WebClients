import type { Dispatch, SetStateAction } from 'react';
import { useEffect } from 'react';

import { c } from 'ttag';

import { useGetCalendarUserSettings } from '@proton/calendar/calendarUserSettings/hooks';
import DynamicProgress from '@proton/components/components/progress/DynamicProgress';
import { getEventsCount } from '@proton/shared/lib/api/calendars';
import { getApiWithAbort } from '@proton/shared/lib/api/helpers/customConfig';
import { processInBatches } from '@proton/shared/lib/calendar/export/export';
import type { ExportCalendarModel, ExportError, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import { EXPORT_ERRORS, EXPORT_STEPS } from '@proton/shared/lib/interfaces/calendar';

import { useApi, useGetAddressKeys, useGetAddresses, useGetCalendarInfo, useGetCalendarKeys } from '../../../hooks';

interface Props {
    model: ExportCalendarModel;
    setModel: Dispatch<SetStateAction<ExportCalendarModel>>;
    onFinish: (vevents: VcalVeventComponent[], exportErrors: ExportError[], keepError?: boolean) => void;
}
const ExportingModalContent = ({ model, setModel, onFinish }: Props) => {
    const api = useApi();
    const getAddresses = useGetAddresses();
    const getCalendarInfo = useGetCalendarInfo();
    const getAddressKeys = useGetAddressKeys();
    const getCalendarKeys = useGetCalendarKeys();
    const getCalendarUserSettings = useGetCalendarUserSettings();

    const { totalFetched, totalToProcess, totalProcessed, exportErrors } = model;
    const totalErrors = exportErrors.length;

    useEffect(() => {
        // Prepare api for allowing cancellation in the middle of the export
        const abortController = new AbortController();
        const { signal } = abortController;

        const setModelWithAbort = (set: (currentModel: ExportCalendarModel) => ExportCalendarModel) => {
            if (signal.aborted) {
                return;
            }
            setModel(set);
        };

        const handleExportProgress = (
            eventIDs: string[],
            veventComponents: VcalVeventComponent[],
            exportErrors: ExportError[]
        ) => {
            setModelWithAbort((currentModel) => ({
                ...currentModel,
                totalFetched: currentModel.totalFetched + eventIDs.length,
                totalProcessed: currentModel.totalProcessed + veventComponents.length,
                exportErrors: [...currentModel.exportErrors, ...exportErrors],
            }));
        };

        const process = async () => {
            try {
                const [addresses, { calendarSettings }, calendarUserSettings] = await Promise.all([
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
                    calendar: model.calendar,
                    addresses,
                    api: getApiWithAbort(api, signal),
                    signal,
                    onProgress: handleExportProgress,
                    getAddressKeys,
                    getCalendarKeys,
                    totalToProcess,
                    weekStartsOn: model.weekStartsOn,
                    calendarSettings,
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
            } catch (error: any) {
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

                onFinish([], [], true);
            }
        };

        void process();

        return () => {
            abortController.abort();
        };
    }, []);

    const display = !totalProcessed
        ? c('Export calendar').t`Loading events`
        : c('Export calendar').t`Decrypting events from your calendar: ${totalProcessed}/${totalToProcess}`;

    return (
        <>
            <div className="mb-4">
                {c('Export calendar').t`Please don't close the tab before the exporting process is finished.`}
            </div>
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
