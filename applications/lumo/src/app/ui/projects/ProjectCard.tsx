import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import {
    Dropdown,
    DropdownMenu,
    DropdownMenuButton,
    Icon,
    useModalStateObject,
    usePopperAnchor,
} from '@proton/components';
import clsx from '@proton/utils/clsx';

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
}

export const ProjectCard = ({ project, onSignInRequired }: ProjectCardProps) => {
    const history = useHistory();
    const isGuest = useIsGuest();
    const { hasLumoPlus } = useLumoPlan();
    const myProjects = useProjects();
    const { createProject, deleteProject } = useProjectActions();
    const deleteModal = useModalStateObject();
    const projectLimitModal = useModalStateObject();
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const handleClick = async () => {
        if (project.isExample) {
            // Check if user is signed in
            if (isGuest) {
                onSignInRequired?.();
                return;
            }

            // Check project limit for free users
            if (!hasLumoPlus && myProjects.length >= 1) {
                projectLimitModal.openModal(true);
                return;
            }

            // Create a new project from example template
            const { spaceId } = await createProject(
                project.name,
                project.instructions || '',
                [],
                project.icon
            );
            // Navigate to the newly created project
            if (spaceId) {
                history.push(`/projects/${spaceId}`);
            }
        } else {
            // Navigate to project detail view
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
        <div className={clsx('project-card', project.isExample && 'project-card--example')}>
            <div className="project-card-header">
                <div className="project-card-icon" style={{ backgroundColor: category.color }}>
                    <Icon name={category.icon as any} size={5} className="color-white" />
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
                <h3 className="project-card-title">{project.name}</h3>
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

            <div className="project-card-footer">
                {project.isExample ? (
                    <Button color="weak" shape="outline" fullWidth onClick={handleClick}>
                        {c('collider_2025:Button').t`Use this example`}
                    </Button>
                ) : (
                    <Button color="weak" shape="ghost" fullWidth onClick={handleClick}>
                        {c('collider_2025:Button').t`Open project`}
                    </Button>
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
