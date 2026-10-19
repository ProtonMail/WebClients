import type { SetStateAction } from 'react';
import { useId, useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import type { ModalStateProps } from '@proton/components';
import {
    Checkbox,
    InputFieldTwo,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    TextAreaTwo,
    Toggle,
    useModalStateObject,
} from '@proton/components';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { LumoIcon } from '../../../../components/LumoIcon/LumoIcon';
import { RecurrenceRuleFieldset } from '../../../../components/RecurrenceRuleFieldset/RecurrenceRuleFieldset';
import type { RecurrenceRule } from '../../../../components/RecurrenceRuleFieldset/types';
import type { ScheduleDetails } from '../../types';
import type { ScheduleDetailsValidationField } from '../../utils';
import { getEmptyScheduleDetails, getScheduleDetailsValidationErrors } from '../../utils';
import { DeleteScheduledTaskPrompt } from './DeleteScheduledTaskPrompt';
import { DiscardScheduledTaskEditsPrompt } from './DiscardScheduledTaskEditsPrompt';

import './ScheduledTaskEditorModal.scss';

interface ScheduledTaskEditorModalProps extends ModalStateProps {
    /** The initial values for the scheduled task (e.g. from a template). */
    initialValues?: ScheduleDetails;
    /** The mode of the scheduled task editor modal (e.g. create a new task or edit an existing task). */
    mode?: 'create' | 'edit';
    /** The function to call when the user deletes the scheduled task (edit mode). */
    onDelete?: (scheduleId: string) => void;
    /** The function to call when the user saves the scheduled task details. */
    onSave?: (values: ScheduleDetails) => void;
}

export const ScheduledTaskEditorModal = ({
    initialValues,
    mode = 'create',
    onClose: closeModal,
    onDelete,
    onSave,
    ...modalProps
}: ScheduledTaskEditorModalProps) => {
    const formId = useId();
    const { createNotification } = useNotifications();
    const [values, setValues] = useState<ScheduleDetails>(() => initialValues ?? getEmptyScheduleDetails());
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<ScheduleDetailsValidationField, string>>>({});
    const hasEditedRef = useRef(false);
    const discardEditsPrompt = useModalStateObject();
    const deleteTaskPrompt = useModalStateObject();

    const updateValues = (action: SetStateAction<ScheduleDetails>) => {
        hasEditedRef.current = true;
        setValues(action);
    };

    const clearFieldError = (field: ScheduleDetailsValidationField | ScheduleDetailsValidationField[]) => {
        const fields = Array.isArray(field) ? field : [field];

        setFieldErrors((prevFieldErrors) => {
            let nextFieldErrors: Partial<Record<ScheduleDetailsValidationField, string>> | undefined;

            for (const key of fields) {
                if (!prevFieldErrors[key]) continue;
                nextFieldErrors ??= { ...prevFieldErrors };
                delete nextFieldErrors[key];
            }

            return nextFieldErrors ?? prevFieldErrors;
        });
    };

    const handleRequestClose = () => {
        if (hasEditedRef.current) {
            discardEditsPrompt.openModal(true);
        } else {
            closeModal();
        }
    };

    const handleSave = () => {
        const errors = getScheduleDetailsValidationErrors(values);
        setFieldErrors(errors);

        if (Object.keys(errors).length === 0) {
            onSave?.({
                ...values,
                name: values.name.trim(),
                instructions: values.instructions.trim(),
            });
            closeModal();
        } else {
            createNotification({
                text: c('collider_2025:Alert').t`Please fix the form errors and try again.`,
                type: 'error',
            });
        }
    };

    const taskDisplayName = values.name.trim() || c('collider_2025:Label').t`Untitled task`;

    return (
        <>
            <ModalTwo className="scheduled-task-editor-modal" size="large" {...modalProps} onClose={handleRequestClose}>
                <ModalTwoHeader
                    title={
                        mode === 'create'
                            ? // translator: Title for the modal to create a new scheduled task.
                              c('collider_2025:Title').t`New scheduled task`
                            : // translator: Title for the modal to edit an existing scheduled task.
                              c('collider_2025:Title').t`Edit scheduled task`
                    }
                    titleClassName="scheduled-task-editor-modal__title"
                />
                <ModalTwoContent className="m-6 mb-7">
                    <div className="flex flex-column gap-6">
                        {/* Name input field */}
                        <InputFieldTwo
                            assistContainerClassName={fieldErrors.name ? undefined : 'hidden'}
                            className="border-weak rounded"
                            error={fieldErrors.name}
                            id={`${formId}-name`}
                            label={
                                // translator: Label for the name input field of the scheduled task.
                                c('collider_2025:Label').t`Name`
                            }
                            labelContainerClassName="mb-2"
                            maxLength={64}
                            onValue={(name) => {
                                clearFieldError('name');
                                updateValues((prev) => ({ ...prev, name }));
                            }}
                            value={values.name}
                        />

                        {/* Instructions input field */}
                        <InputFieldTwo
                            as={TextAreaTwo}
                            assistContainerClassName={fieldErrors.instructions ? undefined : 'hidden'}
                            className="block px-3 border-weak rounded"
                            error={fieldErrors.instructions}
                            id={`${formId}-instructions`}
                            label={
                                // translator: Label for the instructions input field of the scheduled task.
                                c('collider_2025:Label').t`What should ${LUMO_SHORT_APP_NAME} do each time?`
                            }
                            labelContainerClassName="mb-2"
                            maxLength={1024}
                            onValue={(instructions) => {
                                clearFieldError('instructions');
                                updateValues((prev) => ({ ...prev, instructions }));
                            }}
                            rows={5}
                            value={values.instructions}
                        />

                        {/* Recurrence rule fieldset */}
                        <section className="flex flex-column">
                            <RecurrenceRuleFieldset
                                fieldErrors={{
                                    dateTime: fieldErrors.dateTime,
                                    monthDayPicker: fieldErrors.monthDayPicker,
                                    time: fieldErrors.time,
                                    weekDayPicker: fieldErrors.weekDayPicker,
                                }}
                                onChange={(recurrenceRule: RecurrenceRule) =>
                                    updateValues((prev) => ({ ...prev, recurrenceRule }))
                                }
                                onClearValidationField={clearFieldError}
                                recurrenceRule={values.recurrenceRule}
                                title={
                                    // translator: Label for the section configuring the recurrence rule of the scheduled task.
                                    c('collider_2025:Label').t`When to run`
                                }
                            />
                            <p className="flex flex-nowrap items-center gap-2 m-0 mt-3 color-hint">
                                <LumoIcon aria-hidden className="shrink-0" name="LaptopMinimal" size={14} />
                                <span className="text-sm">
                                    {
                                        // translator: Help text explaining the timing of the scheduled task.
                                        c('collider_2025:Info')
                                            .t`Runs on this computer while ${LUMO_SHORT_APP_NAME} is open. If your computer is asleep, it runs when ${LUMO_SHORT_APP_NAME} next opens.`
                                    }
                                </span>
                            </p>
                        </section>

                        {/* Connectors fieldset */}
                        <section className="flex flex-column gap-3">
                            <span className="m-0 text-rg text-semibold" id={`${formId}-connectors`}>
                                {
                                    // translator: Label for the connectors (bridges to external systems/tools) the scheduled task can use.
                                    c('collider_2025:Label').t`Connectors this task can use`
                                }
                            </span>
                            <fieldset
                                aria-labelledby={`${formId}-connectors`}
                                className="flex flex-wrap gap-2 m-0 p-0 border-none"
                            >
                                <button
                                    className="scheduled-task-editor-modal__add-connector-chip button-ghost-norm inline-flex flex-nowrap shrink-0 items-center gap-1.5 border border-dashed rounded color-weak cursor-pointer interactive interactive--no-background"
                                    type="button"
                                >
                                    <LumoIcon aria-hidden className="shrink-0 color-weak" name="Plus" size={14} />
                                    <span className="color-weak">{
                                        // translator: Button to add a connector (bridge to external systems/tools) to the scheduled task.
                                        c('collider_2025:Action').t`Add connector`
                                    }</span>
                                </button>
                            </fieldset>
                        </section>

                        {/* Auto-approve toggle */}
                        {values.connectors.length > 0 && (
                            <div className="flex flex-nowrap items-center gap-4 py-3">
                                <div className="scheduled-task-editor-modal__auto-approve-icon flex shrink-0 items-center justify-center border border-weak rounded">
                                    <LumoIcon aria-hidden className="color-weak" name="Clock" size={20} />
                                </div>
                                <div className="flex flex-column flex-1 gap-0.5 min-w-0">
                                    <span className="scheduled-task-editor-modal__auto-approve-label text-semibold">{
                                        // translator: Label for the auto-approve toggle to automatically approve the use of connectors (bridges to external systems/tools).
                                        c('collider_2025:Title').t`Auto-approve`
                                    }</span>
                                    <span className="text-rg color-weak" id={`${formId}-auto-approve-description`}>
                                        {
                                            // translator: Description for the auto-approve toggle to automatically approve the use of connectors (bridges to external systems/tools).
                                            c('collider_2025:Description')
                                                .t`Use the connectors above without asking. Off: pause and notify me before each Ask tool.`
                                        }
                                    </span>
                                </div>
                                <Toggle
                                    aria-describedby={`${formId}-auto-approve-description`}
                                    checked={values.autoApprove}
                                    className="shrink-0"
                                    id={`${formId}-auto-approve`}
                                    onChange={() =>
                                        updateValues((prev) => ({ ...prev, autoApprove: !prev.autoApprove }))
                                    }
                                    title={
                                        // translator: Accessible label for the auto-approve toggle to automatically approve the use of connectors (bridges to external systems/tools).
                                        c('collider_2025:Title').t`Auto-approve`
                                    }
                                />
                            </div>
                        )}

                        {/* Notify on complete checkbox */}
                        <Checkbox
                            checked={values.notifyOnComplete}
                            onChange={(event) =>
                                updateValues((prev) => ({ ...prev, notifyOnComplete: event.target.checked }))
                            }
                        >
                            {
                                // translator: Label for the checkbox to notify the user when a run of the scheduled task finishes.
                                c('collider_2025:Label').t`Notify me when a run finishes`
                            }
                        </Checkbox>
                    </div>
                </ModalTwoContent>
                <ModalTwoFooter
                    className={clsx(
                        'scheduled-task-editor-modal__footer flex flex-nowrap gap-3 m-0 px-6 py-4 border-top',
                        mode === 'edit' ? 'justify-space-between' : 'justify-end'
                    )}
                >
                    {mode === 'edit' && (
                        <Button
                            color="danger"
                            onClick={() => deleteTaskPrompt.openModal(true)}
                            shape="outline"
                            size="large"
                        >
                            {
                                // translator: Button to delete the scheduled task from the editor.
                                c('collider_2025:Button').t`Delete task`
                            }
                        </Button>
                    )}
                    <div className="flex flex-nowrap gap-3 m-0">
                        <Button color="weak" onClick={handleRequestClose} size="large">
                            {
                                // translator: Button to cancel the scheduled task editor modal.
                                c('collider_2025:Button').t`Cancel`
                            }
                        </Button>
                        <Button color="norm" onClick={handleSave} size="large">
                            {mode === 'edit'
                                ? // translator: Button to save changes to an existing scheduled task.
                                  c('collider_2025:Button').t`Save changes`
                                : // translator: Button to create a new scheduled task.
                                  c('collider_2025:Button').t`Create task`}
                        </Button>
                    </div>
                </ModalTwoFooter>
            </ModalTwo>

            {discardEditsPrompt.render && (
                <DiscardScheduledTaskEditsPrompt {...discardEditsPrompt.modalProps} onConfirm={closeModal} />
            )}

            {deleteTaskPrompt.render && (
                <DeleteScheduledTaskPrompt
                    {...deleteTaskPrompt.modalProps}
                    onConfirm={() => {
                        onDelete?.(values.id);
                        closeModal();
                    }}
                    taskName={taskDisplayName}
                />
            )}
        </>
    );
};
