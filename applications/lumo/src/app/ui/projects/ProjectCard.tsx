import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Icon, useModalStateObject } from '@proton/components';

import { useIsGuest } from '../../providers/IsGuestProvider';
import { useLumoPlan } from '../../providers/LumoPlanProvider';
import { getProjectCategory } from './constants';
import { useProjects } from './hooks/useProjects';
import { ProjectActionsDropdown } from './ProjectActionsDropdown';
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
    const projectLimitModal = useModalStateObject();

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
                onOpenNewProjectModal(project.name, project.instructions || '', project.icon || 'other');
            }
        } else {
            history.push(`/projects/${project.id}`);
        }
    };

    const category = getProjectCategory(project.icon);

    return (
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        <div
            className="project-card group-hover-opacity-container p-6 border border-weak rounded-lg"
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
                    <Icon name={category.icon as any} size={4.5} className="project-card-icon" />
                    <h3 className="project-card-title">{project.name}</h3>
                </div>
                {!project.isExample && (
                    <div onClick={(e) => e.stopPropagation()}>
                        <ProjectActionsDropdown project={project} />
                    </div>
                )}
            </div>

            <div className="project-card-body">
                {project.description && (
                    <p className="project-card-description" style={{ display: '-webkit-box' }}>
                        {project.description}
                    </p>
                )}

                {!project.isExample && (
                    <div className="project-card-stats">
                        {project.conversationCount !== undefined && (
                            <span className="project-card-stat">
                                <Icon name="speech-bubble" size={3.5} className="mr-1" />
                                {project.conversationCount}{' '}
                                {project.conversationCount === 1
                                    ? c('collider_2025:Label').t`chat`
                                    : c('collider_2025:Label').t`chats`}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {projectLimitModal.render && <ProjectLimitModal {...projectLimitModal.modalProps} />}
        </div>
    );
};
