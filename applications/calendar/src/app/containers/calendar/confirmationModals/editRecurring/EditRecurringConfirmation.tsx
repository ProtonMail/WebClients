import { useState } from 'react';

import { Button } from '@proton/atoms';
import { Alert, BasicModal, Prompt } from '@proton/components';
import { RECURRING_TYPES } from '@proton/shared/lib/calendar/constants';

import type { InviteActions } from '../../../../interfaces/Invite';
import SelectRecurringType from '../SelectRecurringType';
import {
    getCalendarChangeForbiddenTexts,
    getRecurringWarningText,
    getRruleWarningText,
    getTexts,
} from './editRecurringConfirmationTexts';

interface Props {
    types: RECURRING_TYPES[];
    hasSingleEdits: boolean;
    hasSingleDeletes: boolean;
    hasSingleEditsAfter: boolean;
    hasSingleDeletesAfter: boolean;
    hasRruleModification: boolean;
    hasCalendarModification: boolean;
    isBreakingChange: boolean;
    isOrganizer: boolean;
    isAttendee: boolean;
    canEditOnlyPersonalPart: boolean;
    inviteActions: InviteActions;
    onConfirm: ({ type, inviteActions }: { type: RECURRING_TYPES; inviteActions: InviteActions }) => void;
    onClose: () => void;
    isOpen: boolean;
}
const EditRecurringConfirmModal = ({
    types,
    hasSingleEdits,
    hasSingleDeletes,
    hasSingleEditsAfter,
    hasSingleDeletesAfter,
    hasRruleModification,
    hasCalendarModification,
    isBreakingChange,
    isOrganizer,
    isAttendee,
    canEditOnlyPersonalPart,
    inviteActions,
    onConfirm,
    onClose,
    isOpen,
}: Props) => {
    const [type, setType] = useState(types[0]);

    const { title, confirm, cancel, alertText } = getTexts(types, inviteActions);
    const hasPreviousSingleEdits =
        (type === RECURRING_TYPES.ALL && hasSingleEdits) || (type === RECURRING_TYPES.FUTURE && hasSingleEditsAfter);
    const hasPreviousSingleDeletes =
        (type === RECURRING_TYPES.ALL && hasSingleDeletes) ||
        (type === RECURRING_TYPES.FUTURE && hasSingleDeletesAfter);
    const hasPreviousModifications = hasPreviousSingleEdits || hasPreviousSingleDeletes;
    const recurringWarningText = getRecurringWarningText({
        inviteActions,
        hasPreviousSingleEdits,
        hasPreviousSingleDeletes,
        isOrganizer,
        isBreakingChange,
        canEditOnlyPersonalPart,
    });

    const showRruleWarning = !isAttendee && type === RECURRING_TYPES.SINGLE && hasRruleModification;
    const rruleWarningText = showRruleWarning ? getRruleWarningText() : '';

    if (isAttendee && hasCalendarModification && hasPreviousModifications) {
        const { title, cancel, alertText } = getCalendarChangeForbiddenTexts();
        return (
            <BasicModal
                title={title}
                footer={<Button onClick={onClose}>{cancel}</Button>}
                onClose={onClose}
                size="small"
                isOpen={isOpen}
            >
                {alertText}
            </BasicModal>
        );
    }

    const handleSubmit = () => {
        onConfirm({ type, inviteActions });
    };

    return (
        <Prompt
            title={title}
            buttons={[
                <Button color="norm" onClick={handleSubmit}>
                    {confirm}
                </Button>,
                <Button onClick={onClose}>{cancel}</Button>,
            ]}
            onSubmit={handleSubmit}
            onClose={onClose}
            open={isOpen}
        >
            <div className="mb-4">{alertText}</div>
            {types.length > 1 ? (
                <SelectRecurringType
                    types={types}
                    type={type}
                    setType={setType}
                    data-testid="update-recurring-popover:update-option-radio"
                />
            ) : null}
            {recurringWarningText ? (
                <Alert className="mb-4" type="warning">
                    {recurringWarningText}
                </Alert>
            ) : null}
            {rruleWarningText ? (
                <Alert className="mb-4" type="warning">
                    {rruleWarningText}
                </Alert>
            ) : null}
        </Prompt>
    );
};

export default EditRecurringConfirmModal;
