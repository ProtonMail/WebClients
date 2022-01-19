import { createExportIcs } from '@proton/shared/lib/calendar/export/createExportIcs';
import { getProdIdFromNameAndVersion } from '@proton/shared/lib/calendar/vcalConfig';
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
import { useState } from 'react';
import { c } from 'ttag';

import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { format } from 'date-fns';
import { getAppHref, getClientID } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { Button, ModalTwo, ModalTwoHeader, ModalTwoContent, ModalTwoFooter } from '../../../components';
import { useGetVtimezonesMap } from '../../../hooks/useGetVtimezonesMap';
import ExportingModalContent from './ExportingModalContent';
import ExportSummaryModalContent from './ExportSummaryModalContent';
import { useGetCalendarUserSettings, useUserSettings } from '../../../hooks';

interface Props {
    calendar: Calendar;
    onClose: () => void;
    isOpen: boolean;
}

export const ExportModal = ({ calendar, onClose, isOpen }: Props) => {
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

    const { content, onSubmit } = (() => {
        if (model.step === EXPORT_STEPS.EXPORTING) {
            const handleFinish = async (
                exportedEvents: VcalVeventComponent[],
                exportErrors: ExportError[],
                keepError?: boolean
            ) => {
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
                updateModel({
                    step: EXPORT_STEPS.FINISHED,
                    exportErrors,
                    ...(!keepError && { error: undefined }),
                });
                setCalendarBlob(new Blob([ics], { type: 'text/plain;charset=utf-8' }));
            };

            return {
                content: <ExportingModalContent model={model} setModel={setModel} onFinish={handleFinish} />,
                onSubmit: null,
            };
        }

        return {
            content: <ExportSummaryModalContent model={model} />,
            onSubmit: () => {
                if (model.error === EXPORT_ERRORS.NETWORK_ERROR) {
                    updateModel({ step: EXPORT_STEPS.EXPORTING });
                    return;
                }

                downloadFile(calendarBlob, `${calendar.Name}-${format(Date.now(), 'yyyy-MM-dd')}.ics`);
                onClose();
            },
        };
    })();

    return (
        <ModalTwo open={isOpen} size="large" fullscreenOnMobile onClose={onClose}>
            <ModalTwoHeader title={c('Title').t`Export calendar`} />
            <ModalTwoContent>{content}</ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                {!!onSubmit && (
                    <Button color="norm" onClick={onSubmit} type="submit">
                        {model.error === EXPORT_ERRORS.NETWORK_ERROR
                            ? c('Action').t`Try again`
                            : c('Action').t`Save ICS file`}
                    </Button>
                )}
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ExportModal;
