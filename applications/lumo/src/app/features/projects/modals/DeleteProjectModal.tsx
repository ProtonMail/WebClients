import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import type { ModalStateProps } from '@proton/components';

import type { Project } from '../types';

import './DeleteProjectModal.scss';

interface DeleteProjectModalProps extends ModalStateProps {
    project: Project;
    onConfirmDelete: () => void;
}

export const DeleteProjectModal = ({ project, onConfirmDelete, ...modalProps }: DeleteProjectModalProps) => {
    const handleDelete = () => {
        onConfirmDelete();
        modalProps.onClose?.();
    };

    return (
        <ModalTwo {...modalProps} size="small">
            <ModalTwoHeader title={c('collider_2025:Title').t`Delete project?`} />
            <ModalTwoContent>
                <div className="delete-project-modal-content">
                    <p className="mb-4">
                        {c('collider_2025:Info')
                            .t`Are you sure you want to delete "${project.name}"? This action cannot be undone.`}
                    </p>
                    {project.conversationCount !== undefined && project.conversationCount > 0 && (
                        <div className="delete-project-modal-warning">
                            <p className="text-bold mb-2">
                                {c('collider_2025:Warning').t`This will also permanently delete:`}
                            </p>
                            <ul className="ml-4">
                                <li>
                                    {project.conversationCount === 1
                                        ? c('collider_2025:Info').t`${project.conversationCount} conversation`
                                        : c('collider_2025:Info').t`${project.conversationCount} conversations`}
                                </li>
                                {project.fileCount !== undefined && project.fileCount > 0 && (
                                    <li>
                                        {project.fileCount === 1
                                            ? c('collider_2025:Info').t`${project.fileCount} file`
                                            : c('collider_2025:Info').t`${project.fileCount} files`}
                                    </li>
                                )}
                                <li>{c('collider_2025:Info').t`All messages and chat history`}</li>
                            </ul>
                        </div>
                    )}
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={modalProps.onClose}>{c('collider_2025:Action').t`Cancel`}</Button>
                <Button color="danger" onClick={handleDelete}>
                    {c('collider_2025:Action').t`Delete project`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

