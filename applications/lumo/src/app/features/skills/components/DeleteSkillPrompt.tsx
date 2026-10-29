import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';

interface DeleteSkillPromptProps extends ModalStateProps {
    skillName: string;
    onConfirm: () => void;
}

export const DeleteSkillPrompt = ({ skillName, onConfirm, ...modalProps }: DeleteSkillPromptProps) => (
    <Prompt
        {...modalProps}
        title={c('collider_2025:Title').t`Delete skill?`}
        buttons={[
            <Button
                color="danger"
                key="delete"
                onClick={() => {
                    onConfirm();
                    modalProps.onClose?.();
                }}
            >
                {c('collider_2025:Action').t`Delete skill`}
            </Button>,
            <Button key="cancel" onClick={modalProps.onClose}>
                {c('collider_2025:Action').t`Cancel`}
            </Button>,
        ]}
    >
        <p className="m-0">
            {
                // translator: ${skillName} is the name of the skill being deleted.
                c('collider_2025:Info').t`"${skillName}" and its files will be deleted. This cannot be undone.`
            }
        </p>
    </Prompt>
);
