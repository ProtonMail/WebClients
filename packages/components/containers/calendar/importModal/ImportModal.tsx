import type { ChangeEvent } from 'react';
import { useEffect, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import BasicModal from '@proton/components/components/modalTwo/BasicModal';
import { updateMember } from '@proton/shared/lib/api/calendars';
import { getProbablyActiveCalendars, getWritableCalendars } from '@proton/shared/lib/calendar/calendar';
import { ICAL_METHOD, IMPORT_ERROR_TYPE, MAX_IMPORT_FILE_SIZE } from '@proton/shared/lib/calendar/constants';
import { IMPORT_EVENT_ERROR_TYPE, ImportEventError } from '@proton/shared/lib/calendar/icsSurgery/ImportEventError';
import { ImportFatalError } from '@proton/shared/lib/calendar/import/ImportFatalError';
import { ImportFileError } from '@proton/shared/lib/calendar/import/ImportFileError';
import {
    extractTotals,
    getSupportedEventsOrErrors,
    parseIcs,
    sendImportErrorTelemetryReport,
    splitErrors,
    splitHiddenErrors,
} from '@proton/shared/lib/calendar/import/import';
import { getMemberAndAddress } from '@proton/shared/lib/calendar/members';
import { APPS } from '@proton/shared/lib/constants';
import { splitExtension } from '@proton/shared/lib/helpers/file';
import type { ImportCalendarModel, ImportedEvent, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import { IMPORT_STEPS } from '@proton/shared/lib/interfaces/calendar';
import { useFlag } from '@proton/unleash';
import noop from '@proton/utils/noop';

import { useAddresses, useApi, useConfig, useEventManager, useGetCalendarUserSettings, useUser } from '../../../hooks';
import { useCalendarModelEventManager } from '../../eventManager/calendar/CalendarModelEventManagerProvider';
import AttachingModalContent from './AttachingModalContent';
import ImportInvitationModalContent from './ImportInvitationModalContent';
import ImportSummaryModalContent from './ImportSummaryModalContent';
import ImportingModalContent from './ImportingModalContent';
import PartialImportModalContent from './PartialImportModalContent';

interface Props {
    initialCalendar: VisualCalendar;
    calendars: VisualCalendar[];
    onClose?: () => void;
    onExit?: () => void;
    files?: File[];
    isOpen?: boolean;
}

const getInitialState = (calendar: VisualCalendar): ImportCalendarModel => ({
    step: IMPORT_STEPS.ATTACHING,
    calendar,
    eventsParsed: [],
    totalEncrypted: 0,
    totalImported: 0,
    visibleErrors: [],
    hiddenErrors: [],
    loading: false,
});

const ImportModal = ({ calendars, initialCalendar, files, isOpen = false, onClose, onExit }: Props) => {
    const [addresses] = useAddresses();
    const api = useApi();
    const { APP_NAME } = useConfig();
    const { call: coreCall } = useEventManager();
    const getCalendarUserSettings = useGetCalendarUserSettings();
    const { call: calendarCall } = useCalendarModelEventManager();
    const [{ hasPaidMail }] = useUser();
    const isColorPerEventEnabled = useFlag('ColorPerEventWeb');
    const [model, setModel] = useState<ImportCalendarModel>(getInitialState(initialCalendar));

    const isCalendar = APP_NAME === APPS.PROTONCALENDAR;
    const activeWritableCalendars = getWritableCalendars(getProbablyActiveCalendars(calendars));

    const handleFiles = (files: File[]) => {
        const [file] = files;
        const filename = file.name;
        const [, extension] = splitExtension(filename);
        const fileAttached = extension.toLowerCase() === 'ics' ? file : null;
        if (!fileAttached) {
            throw new ImportFileError(IMPORT_ERROR_TYPE.NO_ICS_FILE, filename);
        }
        if (fileAttached.size > MAX_IMPORT_FILE_SIZE) {
            throw new ImportFileError(IMPORT_ERROR_TYPE.FILE_TOO_BIG, filename);
        }
        setModel({ ...model, step: IMPORT_STEPS.ATTACHED, fileAttached, failure: undefined });
    };

    const onAddFiles = (files: File[]) => {
        try {
            if (!files) {
                throw new ImportFileError(IMPORT_ERROR_TYPE.NO_FILE_SELECTED);
            }

            handleFiles(files);
        } catch (e: any) {
            setModel({ ...model, failure: e });
        }
    };

    const {
        content,
        close = <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
        submit,
        title = c('Title').t`Import events`,
        ...modalProps
    } = (() => {
        if (model.step <= IMPORT_STEPS.ATTACHED) {
            const handleClear = () => {
                setModel(getInitialState(model.calendar));
            };

            const handleAttach = ({ target }: ChangeEvent<HTMLInputElement>) => {
                try {
                    if (!target.files) {
                        throw new ImportFileError(IMPORT_ERROR_TYPE.NO_FILE_SELECTED);
                    }

                    handleFiles([...target.files]);
                } catch (e: any) {
                    setModel({ ...model, failure: e });
                }
            };

            const handleSelectCalendar = (calendar: VisualCalendar) => {
                setModel({ ...model, calendar });
            };
            const handleSubmit = async () => {
                const { fileAttached } = model;
                if (!fileAttached) {
                    throw new Error('No file');
                }
                try {
                    const canImportEventColor = isColorPerEventEnabled && hasPaidMail;

                    setModel({ ...model, loading: true });
                    const [
                        { PrimaryTimezone: primaryTimezone },
                        { components, prodId, calscale, xWrTimezone, method, hashedIcs },
                    ] = await Promise.all([getCalendarUserSettings(), parseIcs(fileAttached)]);
                    const { errors, rest: parsed } = splitErrors(
                        await getSupportedEventsOrErrors({
                            components,
                            method,
                            prodId,
                            calscale,
                            xWrTimezone,
                            primaryTimezone,
                            canImportEventColor,
                        })
                    );
                    // ignore time zone errors
                    const nonIgnoredErrors = errors.filter(
                        (error) =>
                            error instanceof ImportEventError && error.type !== IMPORT_EVENT_ERROR_TYPE.TIMEZONE_IGNORE
                    );
                    sendImportErrorTelemetryReport({
                        errors: nonIgnoredErrors,
                        api,
                        hash: hashedIcs,
                    });

                    const { hidden: hiddenErrors, visible: visibleErrors } = splitHiddenErrors(nonIgnoredErrors);

                    const totalToImport = parsed.length + hiddenErrors.length;
                    const totalErrors = visibleErrors.length;
                    if (!totalToImport && !totalErrors) {
                        throw new ImportFileError(IMPORT_ERROR_TYPE.NO_EVENTS, fileAttached.name);
                    }
                    const step = (() => {
                        if (method !== ICAL_METHOD.PUBLISH) {
                            return IMPORT_STEPS.WARNING_IMPORT_INVITATION;
                        }
                        return totalErrors ? IMPORT_STEPS.WARNING_PARTIAL_IMPORT : IMPORT_STEPS.IMPORTING;
                    })();
                    setModel({
                        ...model,
                        method,
                        hashedIcs,
                        step,
                        eventsParsed: parsed,
                        visibleErrors,
                        hiddenErrors,
                        failure: undefined,
                        loading: false,
                    });
                } catch (e: any) {
                    const failure = e instanceof ImportFileError ? e : new ImportFatalError(e);
                    setModel({
                        ...getInitialState(model.calendar),
                        failure,
                    });
                }
            };

            const submit = (
                <Button
                    color="norm"
                    disabled={model.step === IMPORT_STEPS.ATTACHING}
                    loading={model.loading}
                    type="submit"
                    onClick={handleSubmit}
                >
                    {c('Action').t`Import`}
                </Button>
            );

            return {
                content: (
                    <AttachingModalContent
                        model={model}
                        calendars={activeWritableCalendars}
                        onSelectCalendar={handleSelectCalendar}
                        onAttach={handleAttach}
                        onClear={handleClear}
                        onDrop={onAddFiles}
                    />
                ),
                submit,
                onSubmit: handleSubmit,
            };
        }

        if (model.step <= IMPORT_STEPS.WARNING_IMPORT_INVITATION) {
            const totalEvents = model.eventsParsed.length + model.visibleErrors.length + model.hiddenErrors.length;

            const handleSubmit = () => {
                setModel({
                    ...model,
                    step: model.visibleErrors.length ? IMPORT_STEPS.WARNING_PARTIAL_IMPORT : IMPORT_STEPS.IMPORTING,
                });
            };

            const submit = <Button onClick={handleSubmit} color="norm" type="submit">{c('Action').t`Import`}</Button>;

            return {
                title: c('Title').ngettext(msgid`Import as simple event?`, `Import as simple events?`, totalEvents),
                content: <ImportInvitationModalContent model={model} />,
                submit,
                onSubmit: handleSubmit,
            };
        }

        if (model.step <= IMPORT_STEPS.WARNING_PARTIAL_IMPORT) {
            const handleSubmit = () => {
                setModel({ ...model, step: IMPORT_STEPS.IMPORTING, visibleErrors: [] });
            };
            const { totalToImport } = extractTotals(model);
            const submit = (
                <Button onClick={handleSubmit} color="norm" type="submit">{c('Action').t`Continue import`}</Button>
            );

            return {
                title: !totalToImport ? c('Title').t`Import failed` : c('Title').t`Continue with partial import?`,
                content: <PartialImportModalContent model={model} />,
                submit: totalToImport ? submit : null,
                onSubmit: handleSubmit,
            };
        }

        if (model.step === IMPORT_STEPS.IMPORTING) {
            const submit = (
                <Button color="norm" disabled type="submit">
                    {c('Action').t`Continue`}
                </Button>
            );

            const handleFinish = async (importedEvents: ImportedEvent[]) => {
                setModel((model) => ({ ...model, step: IMPORT_STEPS.FINISHED }));
                if (!importedEvents.length) {
                    return;
                }
                const { Display, ID: calendarID } = model.calendar;
                const calls: Promise<void | void[]>[] = [];
                if (!Display) {
                    const [{ ID: memberID }] = getMemberAndAddress(addresses, model.calendar.Members);
                    await api(updateMember(calendarID, memberID, { Display: 1 }));
                    calls.push(coreCall());
                }
                if (isCalendar) {
                    calls.push(calendarCall([calendarID]));
                }
                await Promise.all(calls);
            };

            const handleSingleEditErrors = async (errors: ImportEventError[]) => {
                // send errors detected at this stage for events with recurrence-id
                void sendImportErrorTelemetryReport({ errors, api, hash: `${model.hashedIcs}-single-edits` });
            };

            return {
                content: (
                    <ImportingModalContent
                        model={model}
                        setModel={setModel}
                        onFinish={handleFinish}
                        onSingleEditErrors={handleSingleEditErrors}
                    />
                ),
                submit,
                onSubmit: noop,
            };
        }
        // model.step === IMPORT_STEPS.FINISHED at this stage
        const submit = (
            <Button className="ml-auto" onClick={onClose} color="norm" type="submit">{c('Action').t`Close`}</Button>
        );

        return {
            content: <ImportSummaryModalContent model={model} />,
            close: null,
            submit,
            onSubmit: onClose,
        };
    })();

    useEffect(() => {
        if (files?.length) {
            onAddFiles(files);
        }
    }, []);

    return (
        <BasicModal
            title={title}
            footer={
                <>
                    {close}
                    {submit}
                </>
            }
            isOpen={isOpen}
            size="large"
            className="w-full"
            fullscreenOnMobile
            onClose={onClose}
            onExit={onExit}
            {...modalProps}
        >
            {content}
        </BasicModal>
    );
};

export default ImportModal;
