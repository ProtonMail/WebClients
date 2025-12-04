import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import {
    Dropdown,
    DropdownMenu,
    DropdownMenuButton,
    Icon,
    useModalStateObject,
    usePopperAnchor,
} from '@proton/components';

import { useIsGuest } from '../../providers/IsGuestProvider';
import { useLumoPlan } from '../../providers/LumoPlanProvider';
import { getProjectCategory } from './constants';
import { useProjectActions } from './hooks/useProjectActions';
import { useProjects } from './hooks/useProjects';
import { DeleteProjectModal } from './modals/DeleteProjectModal';
import { ProjectLimitModal } from './modals/ProjectLimitModal';
import type { Project } from './types';

import './ProjectCard.scss';

interface ProjectCardProps {
    project: Project;
    onSignInRequired?: () => void;
    onOpenNewProjectModal?: (name: string, instructions: string, icon: string) => void;
}

export const ProjectCard = ({ project, onSignInRequired, onOpenNewProjectModal }: ProjectCardProps) => {
    const history = useHistory();
    const isGuest = useIsGuest();
    const { hasLumoPlus } = useLumoPlan();
    const myProjects = useProjects();
    const { deleteProject } = useProjectActions();
    const deleteModal = useModalStateObject();
    const projectLimitModal = useModalStateObject();
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const handleClick = () => {
        if (project.isExample) {
            if (isGuest) {
                onSignInRequired?.();
                return;
            }

            if (!hasLumoPlus && myProjects.length >= 1) {
                projectLimitModal.openModal(true);
                return;
            }

            if (onOpenNewProjectModal) {
                onOpenNewProjectModal(
                    project.name,
                    project.instructions || '',
                    project.icon || 'other'
                );
            }
        } else {
            history.push(`/projects/${project.id}`);
        }
    };

    const category = getProjectCategory(project.icon);

    const handleDelete = () => {
        if (project.spaceId) {
            deleteProject(project.spaceId);
        }
    };

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggle();
    };

    return (
        <div 
            className="project-card p-6 border border-weak rounded-lg"
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick();
                }
            }}
        >
            <div className="project-card-header">
                <div className="project-card-title-row">
                    <Icon name={category.icon as any} size={4.5} className="project-card-icon" style={{ color: category.color }} />
                    <h3 className="project-card-title">{project.name}</h3>
                </div>
                {!project.isExample && (
                    <>
                        <button
                            ref={anchorRef}
                            className="project-card-menu-button"
                            aria-label={c('collider_2025:Action').t`More options`}
                            onClick={handleMenuClick}
                        >
                            <Icon name="three-dots-vertical" size={4} />
                        </button>
                        <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                            <DropdownMenu>
                                <DropdownMenuButton
                                    className="text-left color-danger"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        close();
                                        deleteModal.openModal(true);
                                    }}
                                >
                                    <Icon name="trash" className="mr-2" />
                                    {c('collider_2025:Action').t`Delete project`}
                                </DropdownMenuButton>
                            </DropdownMenu>
                        </Dropdown>
                    </>
                )}
            </div>

            <div className="project-card-body">
                {project.description && (
                    <p className="project-card-description">{project.description}</p>
                )}

                {!project.isExample && (
                    <div className="project-card-stats">
                        {project.fileCount !== undefined && (
                            <span className="project-card-stat">
                                <Icon name="paper-clip" size={3.5} className="mr-1" />
                                {project.fileCount} {project.fileCount === 1 ? c('collider_2025:Label').t`file` : c('collider_2025:Label').t`files`}
                            </span>
                        )}
                        {project.conversationCount !== undefined && (
                            <span className="project-card-stat">
                                <Icon name="speech-bubble" size={3.5} className="mr-1" />
                                {project.conversationCount} {project.conversationCount === 1 ? c('collider_2025:Label').t`chat` : c('collider_2025:Label').t`chats`}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {deleteModal.render && (
                <DeleteProjectModal
                    {...deleteModal.modalProps}
                    project={project}
                    onConfirmDelete={handleDelete}
                />
            )}
            {projectLimitModal.render && <ProjectLimitModal {...projectLimitModal.modalProps} />}
        </div>
    );
};
