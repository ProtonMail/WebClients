import { useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';

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
                className="flex flex-row flex-nowrap p-3 border-none group-hover-opacity-container"
                onClick={handleClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="project-card-main gap-2">
                    <ProjectIcon
                        iconId={project.icon}
                        size={18}
                        className="project-card-icon flex-shrink-0 lumo-color-glyph-mid"
                    />
                    <span className="m-0 lumo-title-medium text-ellipsis lumo-color-glyph">{project.name}</span>
                    {project.conversationCount !== undefined && (
                        <span className="project-card-stat ml-1 lumo-body-medium lumo-color-glyph-mid">
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
                        <span className="lumo-body-large lumo-color-glyph-mid">
                            {formatShortDate(project.createdAt)}
                        </span>
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
            className="group-hover-opacity-container p-4 border lumo-border radius-12"
            onClick={handleClick}
        >
            <div className="project-card-header gap-2">
                <div className="project-card-title-row gap-2">
                    <ProjectIcon iconId={project.icon} size={18} className="project-card-icon" />
                    <h3 className="m-0 lumo-title-small text-ellipsis lumo-color-glyph">{project.name}</h3>
                </div>
                {!project.isExample && (
                    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
                    <div onClick={(e) => e.stopPropagation()}>
                        <ProjectActionsDropdown project={project} />
                    </div>
                )}
            </div>

            <div className="project-card-body gap-1">
                {project.description && (
                    <p
                        className="project-card-description m-0 lumo-body-small text-left lumo-color-glyph-mid"
                        style={{ display: '-webkit-box' }}
                    >
                        {project.description}
                    </p>
                )}

                {!project.isExample && (
                    <div className="project-card-stats gap-3 mt-0.5">
                        {project.conversationCount !== undefined && (
                            <span className="project-card-stat lumo-body-small lumo-color-glyph-mid">
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
