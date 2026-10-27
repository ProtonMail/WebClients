import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';

interface DeleteScheduledTaskPromptProps extends ModalStateProps {
    onConfirm: () => void;
    taskName: string;
}

export const DeleteScheduledTaskPrompt = ({ onConfirm, taskName, ...modalProps }: DeleteScheduledTaskPromptProps) => {
    const handleConfirm = () => {
        onConfirm();
        modalProps.onClose?.();
    };

    return (
        <Prompt
            {...modalProps}
            buttons={[
                <Button color="danger" key="delete" onClick={handleConfirm}>
                    {
                        // translator: Confirms deletion of a scheduled task.
                        c('collider_2025:Action').t`Delete task`
                    }
                </Button>,
                <Button key="cancel" onClick={modalProps.onClose}>
                    {c('collider_2025:Action').t`Cancel`}
                </Button>,
            ]}
            title={
                // translator: Title for the confirmation dialog before deleting a scheduled task.
                c('collider_2025:Title').t`Delete scheduled task?`
            }
        >
            <p className="m-0">
                {
                    // translator: Warning before deleting a scheduled task. ${taskName} is the task name.
                    c('collider_2025:Info')
                        .t`Are you sure you want to delete "${taskName}"? Its run history will also be deleted. This action cannot be undone.`
                }
            </p>
        </Prompt>
    );
};
