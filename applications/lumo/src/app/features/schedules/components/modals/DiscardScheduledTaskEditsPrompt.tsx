import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';

interface DiscardScheduledTaskEditsPromptProps extends ModalStateProps {
    onConfirm: () => void;
}

export const DiscardScheduledTaskEditsPrompt = ({ onConfirm, ...modalProps }: DiscardScheduledTaskEditsPromptProps) => {
    const handleConfirm = () => {
        onConfirm();
        modalProps.onClose?.();
    };

    return (
        <Prompt
            {...modalProps}
            buttons={[
                <Button color="danger" key="discard" onClick={handleConfirm}>
                    {
                        // translator: Closes the scheduled task editor and drops unsaved edits.
                        c('collider_2025:Action').t`Discard changes`
                    }
                </Button>,
                <Button key="cancel" onClick={modalProps.onClose}>
                    {c('collider_2025:Action').t`Keep editing`}
                </Button>,
            ]}
            title={
                // translator: Title when closing the scheduled task editor with unsaved changes.
                c('collider_2025:Title').t`Discard changes?`
            }
        >
            <p className="m-0">
                {
                    // translator: Body when closing the scheduled task editor with unsaved changes.
                    c('collider_2025:Info').t`You may have unsaved changes. If you leave now, your edits will be lost.`
                }
            </p>
        </Prompt>
    );
};
