import { useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { useModalStateObject } from '@proton/components';

import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { ProjectIcon } from '../../components/ProjectIcon/ProjectIcon';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useLumoPlan } from '../../providers/LumoPlanProvider';
import { formatShortDate } from '../../util/date';
import { ProjectActionsDropdown } from './ProjectActionsDropdown';
import { useProjects } from './hooks/useProjects';
import { ProjectLimitModal } from './modals/ProjectLimitModal';
import type { Project } from './types';

import './ProjectCard.scss';

interface ProjectCardProps {
    project: Project;
    listRow?: boolean;
    onSignInRequired?: () => void;
    onOpenNewProjectModal?: (name: string, instructions: string, icon: string) => void;
}

export const ProjectCard = ({
    project,
    listRow = false,
    onSignInRequired,
    onOpenNewProjectModal,
}: ProjectCardProps) => {
    const history = useHistory();
    const isGuest = useIsGuest();
    const { hasLumoPlus } = useLumoPlan();
    const myProjects = useProjects();
    const projectLimitModal = useModalStateObject();
    const [isHovered, setIsHovered] = useState(false);

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

    if (listRow) {
        return (
            <ButtonLike
                shape="ghost"
                fullWidth
                className="flex flex-row flex-nowrap group-hover-opacity-container"
                onClick={handleClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="project-card-main min-h-custom" style={{ '--min-h-custom': '28px' }}>
                    <ProjectIcon
                        iconId={project.icon}
                        size={16}
                        className="project-card-icon color-weak flex-shrink-0"
                    />
                    <span className="project-card-title">{project.name}</span>
                    {project.conversationCount !== undefined && (
                        <span className="project-card-stat text-sm ml-1">
                            <LumoIcon name="MessageSquare" width={14} height={14} className="mr-1" />
                            {project.conversationCount}{' '}
                            {project.conversationCount === 1
                                ? c('collider_2025:Label').t`chat`
                                : c('collider_2025:Label').t`chats`}
                        </span>
                    )}
                </div>

                <div className="project-card-end">
                    {!isHovered && project.createdAt && (
                        <span className="project-card-date">{formatShortDate(project.createdAt)}</span>
                    )}
                    {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
                    <div onClick={(e) => e.stopPropagation()}>
                        <ProjectActionsDropdown project={project} />
                    </div>
                </div>

                {projectLimitModal.render && <ProjectLimitModal {...projectLimitModal.modalProps} />}
            </ButtonLike>
        );
    }

    return (
        <ButtonLike
            shape="ghost"
            className="group-hover-opacity-container p-4 border border-weak rounded-lg"
            onClick={handleClick}
        >
            <div className="project-card-header">
                <div className="project-card-title-row">
                    <ProjectIcon iconId={project.icon} size={18} className="project-card-icon" />
                    <h3 className="project-card-title">{project.name}</h3>
                </div>
                {!project.isExample && (
                    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
                    <div onClick={(e) => e.stopPropagation()}>
                        <ProjectActionsDropdown project={project} />
                    </div>
                )}
            </div>

            <div className="project-card-body">
                {project.description && (
                    <p className="project-card-description text-left color-weak" style={{ display: '-webkit-box' }}>
                        {project.description}
                    </p>
                )}

                {!project.isExample && (
                    <div className="project-card-stats">
                        {project.conversationCount !== undefined && (
                            <span className="project-card-stat">
                                <LumoIcon name="MessageSquare" width={14} height={14} className="mr-1" />
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
        </ButtonLike>
    );
};
