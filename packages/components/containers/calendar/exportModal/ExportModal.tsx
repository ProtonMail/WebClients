import { createExportIcs } from '@proton/shared/lib/calendar/export/createExportIcs';
import { getUniqueVtimezones } from '@proton/shared/lib/calendar/vtimezoneHelper';
import {
    Calendar,
    EXPORT_ERRORS,
    EXPORT_STEPS,
    ExportCalendarModel,
    ExportError,
    VcalVeventComponent,
} from '@proton/shared/lib/interfaces/calendar';
import { getWeekStartsOn } from '@proton/shared/lib/settings/helper';
import React, { useState } from 'react';
import { c } from 'ttag';

import { getProdIdFromNameAndVersion } from '@proton/shared/lib/calendar/vcalHelper';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { format } from 'date-fns';
import { getAppHref, getClientID } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { Button, FormModal } from '../../../components';
import { useGetVtimezonesMap } from '../../../hooks/useGetVtimezonesMap';
import ExportingModalContent from './ExportingModalContent';
import ExportSummaryModalContent from './ExportSummaryModalContent';
import { useGetCalendarUserSettings, useUserSettings } from '../../../hooks';

interface Props {
    calendar: Calendar;
    onClose?: () => void;
}

export const ExportModal = ({ calendar, ...rest }: Props) => {
    const getVTimezonesMap = useGetVtimezonesMap();
    const getCalendarUserSettings = useGetCalendarUserSettings();
    const [userSettings] = useUserSettings();
    const weekStartsOn = getWeekStartsOn(userSettings);

    const [model, setModel] = useState<ExportCalendarModel>({
        step: EXPORT_STEPS.EXPORTING,
        totalFetched: 0,
        totalProcessed: 0,
        exportErrors: [],
        totalToProcess: 0,
        weekStartsOn,
        calendar,
    });
    const updateModel = (changes: Partial<ExportCalendarModel>) =>
        setModel((currentModel: ExportCalendarModel) => ({ ...currentModel, ...changes }));

    const [calendarBlob, setCalendarBlob] = useState<Blob>();

    const { content, ...modalProps } = (() => {
        if (model.step === EXPORT_STEPS.EXPORTING) {
            const handleFinish = async (exportedEvents: VcalVeventComponent[], exportErrors: ExportError[]) => {
                // we don't catch errors here as they're caught into a NETWORK error on ExportingModalContent
                const { PrimaryTimezone: defaultTzid } = await getCalendarUserSettings();
                const uniqueTimezonesPromise = getUniqueVtimezones({
                    vevents: exportedEvents,
                    tzids: [defaultTzid],
                    getVTimezonesMap,
                }).catch(() => {
                    return [];
                });
                const appVersionPromise = fetch(getAppHref('/assets/version.json', APPS.PROTONCALENDAR))
                    .then((result) => result.json())
                    .then((json) => json.version)
                    .catch(() => {
                        // TODO: remove when atlas CSP issues are resolved
                        return '4.1.11';
                    });

                const [uniqueTimezones, appVersion] = await Promise.all([uniqueTimezonesPromise, appVersionPromise]);
                const clientId = getClientID(APPS.PROTONCALENDAR);

                const ics = createExportIcs({
                    calendar,
                    prodId: getProdIdFromNameAndVersion(clientId, appVersion),
                    eventsWithSummary: exportedEvents,
                    defaultTzid,
                    vtimezones: uniqueTimezones,
                });
                updateModel({ step: EXPORT_STEPS.FINISHED, exportErrors, error: undefined });
                setCalendarBlob(new Blob([ics], { type: 'data:text/plain;charset=utf-8;' }));
            };

            return {
                content: <ExportingModalContent model={model} setModel={setModel} onFinish={handleFinish} />,
                submit: null,
            };
        }
        const submit =
            model.error === EXPORT_ERRORS.NETWORK_ERROR ? (
                <Button color="norm" onClick={() => updateModel({ step: EXPORT_STEPS.EXPORTING })}>{c('Action')
                    .t`Try again`}</Button>
            ) : (
                <Button color="norm" type="submit">{c('Action').t`Save ICS file`}</Button>
            );

        return {
            content: <ExportSummaryModalContent model={model} />,
            submit,
            onSubmit: () => {
                downloadFile(calendarBlob, `${calendar.Name}-${format(Date.now(), 'yyyy-MM-dd')}.ics`);
                rest.onClose?.();
            },
        };
    })();

    return (
        <FormModal title={c('Title').t`Export calendar`} {...modalProps} {...rest}>
            {content}
        </FormModal>
    );
};

export default ExportModal;
