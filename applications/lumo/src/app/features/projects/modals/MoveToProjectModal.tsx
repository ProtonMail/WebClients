import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';

import { ProjectIcon } from '../../../components/ProjectIcon/ProjectIcon';
import { useMoveConversationToProject } from '../../../hooks/useMoveConversationToProject';
import type { Conversation } from '../../../types';
import { useProjects } from '../hooks/useProjects';

interface MoveToProjectModalProps extends ModalStateProps {
    conversation: Conversation;
}

export const MoveToProjectModal = ({ conversation, ...modalProps }: MoveToProjectModalProps) => {
    const projects = useProjects();
    const { moveToProject, isMoving } = useMoveConversationToProject(conversation.id);
    const availableProjects = projects.filter((project) => project.id !== conversation.spaceId);

    const handleSelect = (spaceId: string, name: string) => {
        moveToProject(spaceId, name);
        modalProps.onClose?.();
    };

    return (
        <ModalTwo {...modalProps} size="small" enableCloseWhenClickOutside>
            <ModalTwoHeader title={c('collider_2025:Title').t`Move to project`} />
            <ModalTwoContent>
                {availableProjects.length === 0 ? (
                    <p className="m-0 color-weak">{c('collider_2025:Info').t`You don't have any other projects yet.`}</p>
                ) : (
                    <ul className="unstyled m-0 flex flex-column gap-1">
                        {availableProjects.map((project) => (
                            <li key={project.id}>
                                <Button
                                    shape="ghost"
                                    fullWidth
                                    className="flex items-center gap-2 text-left"
                                    disabled={isMoving}
                                    onClick={() => handleSelect(project.id, project.name)}
                                >
                                    <ProjectIcon iconId={project.icon} size={16} className="shrink-0" />
                                    <span className="text-ellipsis">{project.name}</span>
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={modalProps.onClose} color="weak">
                    {c('collider_2025:Button').t`Cancel`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
