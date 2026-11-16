import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';

import type { WorkspaceEntryKind } from './skillWorkspace';

interface DeleteSkillFilePromptProps extends ModalStateProps {
    /** The file or folder name, without its folders. */
    name: string;
    entry: WorkspaceEntryKind;
    onConfirm: () => void;
}

/** Confirms deleting a file or folder in the skill editor. Nothing is gone until the skill is saved. */
export const DeleteSkillFilePrompt = ({ name, entry, onConfirm, ...modalProps }: DeleteSkillFilePromptProps) => {
    const isFolder = entry === 'folder';
    // translator: Title of the prompt confirming the deletion of a file from a skill.
    const fileTitle = c('collider_2025:Title').t`Delete file?`;
    // translator: Title of the prompt confirming the deletion of a folder, and everything in it, from a skill.
    const folderTitle = c('collider_2025:Title').t`Delete folder?`;
    // translator: Body of the prompt confirming the deletion of a file from a skill. ${name} is the file name. The deletion applies once the user saves the skill.
    const fileText = c('collider_2025:Info').t`"${name}" will be removed from this skill when you save.`;
    // translator: Body of the prompt confirming the deletion of a folder from a skill. ${name} is the folder name. The deletion applies once the user saves the skill.
    const folderText = c('collider_2025:Info')
        .t`"${name}" and everything in it will be removed from this skill when you save.`;
    // translator: Button that confirms deleting a file or folder from a skill.
    const deleteLabel = c('collider_2025:Action').t`Delete`;
    // translator: Button that closes the prompt without deleting anything.
    const cancelLabel = c('collider_2025:Action').t`Cancel`;

    return (
        <Prompt
            {...modalProps}
            title={isFolder ? folderTitle : fileTitle}
            buttons={[
                <Button
                    color="danger"
                    key="delete"
                    onClick={() => {
                        onConfirm();
                        modalProps.onClose?.();
                    }}
                >
                    {deleteLabel}
                </Button>,
                <Button key="cancel" onClick={modalProps.onClose}>
                    {cancelLabel}
                </Button>,
            ]}
        >
            <p className="m-0">{isFolder ? folderText : fileText}</p>
        </Prompt>
    );
};
