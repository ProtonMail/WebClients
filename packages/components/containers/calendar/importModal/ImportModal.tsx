import { updateCalendar } from '@proton/shared/lib/api/calendars';

import { ICAL_METHOD, IMPORT_ERROR_TYPE, MAX_IMPORT_FILE_SIZE } from '@proton/shared/lib/calendar/constants';
import {
    extractTotals,
    getSupportedEvents,
    parseIcs,
    splitErrors,
    splitHiddenErrors,
} from '@proton/shared/lib/calendar/import/import';
import { ImportFatalError } from '@proton/shared/lib/calendar/import/ImportFatalError';

import { ImportFileError } from '@proton/shared/lib/calendar/import/ImportFileError';
import { splitExtension } from '@proton/shared/lib/helpers/file';
import { noop } from '@proton/shared/lib/helpers/function';
import { Calendar, IMPORT_STEPS, ImportCalendarModel, ImportedEvent } from '@proton/shared/lib/interfaces/calendar';
import { ChangeEvent, DragEvent, useEffect, useState } from 'react';
import { c, msgid } from 'ttag';
import { onlyDragFiles, Button, BasicModal } from '../../../components';

import { useApi, useEventManager } from '../../../hooks';

import AttachingModalContent from './AttachingModalContent';
import ImportingModalContent from './ImportingModalContent';
import ImportInvitationModalContent from './ImportInvitationModalContent';
import ImportSummaryModalContent from './ImportSummaryModalContent';
import PartialImportModalContent from './PartialImportModalContent';

interface Props {
    defaultCalendar: Calendar;
    calendars: Calendar[];
    onClose?: () => void;
    onExit?: () => void;
    files?: File[];
    isOpen?: boolean;
}

const getInitialState = (calendar: Calendar): ImportCalendarModel => ({
    step: IMPORT_STEPS.ATTACHING,
    calendar,
    eventsParsed: [],
    totalEncrypted: 0,
    totalImported: 0,
    visibleErrors: [],
    hiddenErrors: [],
    loading: false,
});

const ImportModal = ({ calendars, defaultCalendar, files, isOpen = false, onClose, onExit }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const [model, setModel] = useState<ImportCalendarModel>(getInitialState(defaultCalendar));
    const [isDropzoneHovered, setIsDropzoneHovered] = useState(false);

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

            const handleHover = (hover: boolean) =>
                onlyDragFiles((event: DragEvent) => {
                    setIsDropzoneHovered(hover);
                    event.stopPropagation();
                });

            const handleDrop = onlyDragFiles((event: DragEvent) => {
                event.preventDefault();
                setIsDropzoneHovered(false);
                onAddFiles([...event.dataTransfer.files]);
            });

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

            const handleSelectCalendar = (calendar: Calendar) => {
                setModel({ ...model, calendar });
            };

            const handleSubmit = async () => {
                const { fileAttached } = model;
                if (!fileAttached) {
                    throw new Error('No file');
                }
                try {
                    setModel({ ...model, loading: true });
                    const { components, calscale, xWrTimezone, method } = await parseIcs(fileAttached);
                    const { errors, rest: parsed } = splitErrors(
                        await getSupportedEvents({
                            components,
                            method,
                            calscale,
                            xWrTimezone,
                        })
                    );
                    const { hidden: hiddenErrors, visible: visibleErrors } = splitHiddenErrors(errors);

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
                        calendars={calendars}
                        onSelectCalendar={handleSelectCalendar}
                        onAttach={handleAttach}
                        onClear={handleClear}
                        isDropzoneHovered={isDropzoneHovered}
                        onDrop={handleDrop}
                        onDragEnter={handleHover(true)}
                        onDragLeave={handleHover(false)}
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
                if (!Display) {
                    await api(updateCalendar(calendarID, { Display: 1 }));
                }
                await call();
            };

            return {
                content: <ImportingModalContent model={model} setModel={setModel} onFinish={handleFinish} />,
                submit,
                onSubmit: noop,
            };
        }
        // model.step === IMPORT_STEPS.FINISHED at this stage
        const submit = (
            <Button className="mlauto" onClick={onClose} color="norm" type="submit">{c('Action').t`Close`}</Button>
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
            className="w100"
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
