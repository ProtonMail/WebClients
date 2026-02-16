import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Prompt from '@proton/components/components/prompt/Prompt';
import { RECURRING_TYPES } from '@proton/shared/lib/calendar/constants';

import type { InviteActions, RecurringActionData } from '../../../../interfaces/Invite';
import { getTexts } from './editSingleConfirmTexts';

interface Props {
    inviteActions: InviteActions;
    onConfirm: ({ type, inviteActions }: RecurringActionData) => void;
    onClose: () => void;
    isOpen: boolean;
}

const EditSingleConfirmModal = ({ inviteActions, onConfirm, onClose, isOpen }: Props) => {
    const modalTexts = getTexts(inviteActions);

    const handleSubmit = () => {
        onConfirm({ type: RECURRING_TYPES.SINGLE, inviteActions });
        onClose();
    };

    return (
        <Prompt
            title={modalTexts.title}
            onClose={onClose}
            onExit={onClose}
            open={isOpen}
            buttons={[
                <Button type="submit" onClick={async () => handleSubmit()} shape="solid" color="norm">
                    {modalTexts.submit}
                </Button>,
                <Button type="reset" onClick={onClose}>
                    {c('Action').t`Cancel`}
                </Button>,
            ]}
        >
            {modalTexts.alertText}
        </Prompt>
    );
};

export default EditSingleConfirmModal;
