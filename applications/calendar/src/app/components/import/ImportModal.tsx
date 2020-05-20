import { splitExtension } from 'proton-shared/lib/helpers/file';
import { noop } from 'proton-shared/lib/helpers/function';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import React, { ChangeEvent, useState } from 'react';
import { FormModal, PrimaryButton, useEventManager } from 'react-components';
import { c } from 'ttag';

import { MAX_IMPORT_FILE_SIZE } from '../../constants';
import { filterNonSupported, parseIcs } from '../../helpers/import';
import { IMPORT_STEPS, ImportCalendarModel } from '../../interfaces/Import';

import AttachingModalContent from './AttachingModalContent';
import ImportingModalContent from './ImportingModalContent';
import ImportSummaryModalContent from './ImportSummaryModalContent';
import WarningModalContent from './WarningModalContent';
import { IMPORT_ERROR_TYPE, ImportFileError } from './ImportFileError';

interface Props {
    defaultCalendar: Calendar;
    calendars: Calendar[];
    onClose?: () => void;
}
const ImportModal = ({ calendars, defaultCalendar, ...rest }: Props) => {
    const { call } = useEventManager();
    const [model, setModel] = useState<ImportCalendarModel>({
        step: IMPORT_STEPS.ATTACHING,
        calendar: defaultCalendar,
        eventsParsed: [],
        eventsNotParsed: [],
        eventsEncrypted: [],
        eventsNotEncrypted: [],
        eventsImported: [],
        eventsNotImported: []
    });

    const { content, ...modalProps } = (() => {
        if (model.step <= IMPORT_STEPS.ATTACHED) {
            const submit = (
                <PrimaryButton disabled={model.step === IMPORT_STEPS.ATTACHING} type="submit">
                    {c('Action').t`Import`}
                </PrimaryButton>
            );

            const handleClear = () => {
                setModel({
                    step: IMPORT_STEPS.ATTACHING,
                    calendar: model.calendar,
                    eventsParsed: [],
                    eventsNotParsed: [],
                    eventsEncrypted: [],
                    eventsNotEncrypted: [],
                    eventsImported: [],
                    eventsNotImported: []
                });
            };

            const handleAttach = ({ target }: ChangeEvent<HTMLInputElement>) => {
                try {
                    if (!target.files) {
                        throw new ImportFileError(IMPORT_ERROR_TYPE.NO_FILE_SELECTED);
                    }
                    const [file] = target.files;
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
                } catch (e) {
                    setModel({ ...model, failure: e });
                }
            };

            const handleSelectCalendar = (calendar: Calendar) => {
                setModel({ ...model, calendar: calendar });
            };

            const handleSubmit = async () => {
                const { fileAttached } = model;
                if (!fileAttached) {
                    throw new Error('No file');
                }
                try {
                    const { components, calscale } = await parseIcs(fileAttached);
                    const { events, discarded } = filterNonSupported({ components, calscale });
                    const step = discarded.length || !events.length ? IMPORT_STEPS.WARNING : IMPORT_STEPS.IMPORTING;
                    setModel({
                        ...model,
                        step,
                        eventsParsed: events,
                        eventsNotParsed: discarded,
                        failure: undefined
                    });
                } catch (e) {
                    setModel({
                        step: IMPORT_STEPS.ATTACHING,
                        calendar: model.calendar,
                        eventsParsed: [],
                        eventsNotParsed: [],
                        eventsEncrypted: [],
                        eventsNotEncrypted: [],
                        eventsImported: [],
                        eventsNotImported: [],
                        failure: e
                    });
                }
            };

            return {
                content: (
                    <AttachingModalContent
                        model={model}
                        calendars={calendars}
                        onSelectCalendar={handleSelectCalendar}
                        onAttach={handleAttach}
                        onClear={handleClear}
                    />
                ),
                submit,
                onSubmit: handleSubmit
            };
        }

        if (model.step <= IMPORT_STEPS.WARNING) {
            const submit = (
                <PrimaryButton disabled={!model.eventsParsed?.length} type="submit">
                    {c('Action').t`Import`}
                </PrimaryButton>
            );

            const handleSubmit = () => {
                setModel({ ...model, step: IMPORT_STEPS.IMPORTING });
            };

            return {
                title: c('Title').t`Warning`,
                content: <WarningModalContent model={model} />,
                submit,
                onSubmit: handleSubmit
            };
        }

        if (model.step === IMPORT_STEPS.IMPORTING) {
            const submit = (
                <PrimaryButton disabled={true} type="submit">
                    {c('Action').t`Continue`}
                </PrimaryButton>
            );

            const handleFinish = async () => {
                setModel((model) => ({ ...model, step: IMPORT_STEPS.FINISHED }));
                await call();
            };

            return {
                content: <ImportingModalContent model={model} setModel={setModel} onFinish={handleFinish} />,
                submit,
                onSubmit: noop
            };
        }
        // model.step === IMPORT_STEPS.FINISHED at this stage
        const submit = <PrimaryButton type="submit">{c('Action').t`Close`}</PrimaryButton>;

        return {
            content: <ImportSummaryModalContent model={model} />,
            submit,
            close: null,
            onSubmit: rest.onClose
        };
    })();

    return (
        <FormModal title={c('Title').t`Import events`} {...modalProps} {...rest}>
            {content}
        </FormModal>
    );
};

export default ImportModal;
