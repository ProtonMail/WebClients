import { useState } from 'react';

import { format } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useGetCalendarUserSettings } from '@proton/calendar/calendarUserSettings/hooks';
import BasicModal from '@proton/components/components/modalTwo/BasicModal';
import { getAppVersion } from '@proton/components/helpers/appVersion';
import { createExportIcs } from '@proton/shared/lib/calendar/export/createExportIcs';
import { getProdIdFromNameAndVersion } from '@proton/shared/lib/calendar/vcalConfig';
import { getUniqueVtimezones } from '@proton/shared/lib/calendar/vtimezoneHelper';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import type {
    ExportCalendarModel,
    ExportError,
    VcalVeventComponent,
    VisualCalendar,
} from '@proton/shared/lib/interfaces/calendar';
import { EXPORT_ERRORS, EXPORT_STEPS } from '@proton/shared/lib/interfaces/calendar';
import { getWeekStartsOn } from '@proton/shared/lib/settings/helper';

import { useConfig, useUserSettings } from '../../../hooks';
import { useGetVtimezonesMap } from '../../../hooks/useGetVtimezonesMap';
import ExportSummaryModalContent from './ExportSummaryModalContent';
import ExportingModalContent from './ExportingModalContent';

interface Props {
    calendar: VisualCalendar;
    onClose?: () => void;
    onExit?: () => void;
    isOpen?: boolean;
}

export const ExportModal = ({ calendar, onClose, onExit, isOpen = false }: Props) => {
    const getVTimezonesMap = useGetVtimezonesMap();
    const getCalendarUserSettings = useGetCalendarUserSettings();
    const [userSettings] = useUserSettings();
    const weekStartsOn = getWeekStartsOn(userSettings);
    const { APP_VERSION } = useConfig();
    const appVersion = getAppVersion(APP_VERSION);

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
                const uniqueTimezones = await getUniqueVtimezones({
                    vevents: exportedEvents,
                    tzids: [defaultTzid],
                    getVTimezonesMap,
                }).catch(() => {
                    return [];
                });

                const ics = createExportIcs({
                    calendar,
                    // We use the ProtonAccount version here,
                    // but we do not want to display 'Web Account' in this public PRODID
                    // As a compromise between a "marketing display" and traceability,
                    // we add a '.a' suffix to indicate that the version refers to Proton Account
                    prodId: getProdIdFromNameAndVersion('WebCalendar', `${appVersion}.a`),
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
                onClose?.();
            },
        };
    })();

    return (
        <BasicModal
            title={c('Title').t`Export calendar`}
            footer={
                <>
                    <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                    {!!onSubmit && (
                        <Button color="norm" onClick={onSubmit} type="submit">
                            {model.error === EXPORT_ERRORS.NETWORK_ERROR
                                ? c('Action').t`Try again`
                                : c('Action').t`Save ICS file`}
                        </Button>
                    )}
                </>
            }
            isOpen={isOpen}
            size="large"
            fullscreenOnMobile
            onClose={onClose}
            onExit={onExit}
        >
            {content}
        </BasicModal>
    );
};

export default ExportModal;
