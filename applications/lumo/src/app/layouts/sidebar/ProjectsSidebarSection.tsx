import { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { Icon, useModalStateObject } from '@proton/components';

import { LumoLink } from '../../components/Links/LumoLink';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useLumoPlan } from '../../providers/LumoPlanProvider';
import { useSidebar } from '../../providers/SidebarProvider';
import { DismissedFeaturePill } from '../../components/DismissedFeaturePill';
import { useProjects } from '../../features/projects';
import { getProjectCategory } from '../../features/projects/constants';
import { NewProjectModal } from '../../features/projects';
import { ProjectLimitModal } from '../../features/projects/modals/ProjectLimitModal';
import { ProjectActionsDropdown } from '../../features/projects/ProjectActionsDropdown';

interface ProjectsSidebarSectionProps {
    showText: boolean;
    onItemClick?: () => void;
}

export const ProjectsSidebarSection = ({ showText, onItemClick }: ProjectsSidebarSectionProps) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isHovered, setIsHovered] = useState(false);
    const projects = useProjects();
    const history = useHistory();
    const location = useLocation();

    const isGuest = useIsGuest();
    const { hasLumoPlus } = useLumoPlan();
    const { isCollapsed, isVisible, isSmallScreen, toggle } = useSidebar();
    const newProjectModal = useModalStateObject();
    const projectLimitModal = useModalStateObject();

    useEffect(() => {
        if (isSmallScreen) {
            setIsExpanded(isVisible);
        } else if (isCollapsed) {
            setIsExpanded(false);
        } else {
            const timer = setTimeout(() => {
                setIsExpanded(true);
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [isCollapsed, isVisible, isSmallScreen]);

    const currentProjectId = useMemo(() => {
        const match = location.pathname.match(/^\/projects\/([^/]+)/);
        return match ? match[1] : null;
    }, [location.pathname]);

    const isProjectsPage = location.pathname === '/projects';

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    const handleProjectsHeaderClick = () => {
        if (isGuest) {
            if (onItemClick) {
                onItemClick();
            }
            history.push('/projects');
            return;
        }

        if (isCollapsed) {
            toggle();
        } else {
            if (onItemClick) {
                onItemClick();
            }
            history.push('/projects');
        }
    };

    const handleProjectsClick = () => {
        if (onItemClick) {
            onItemClick();
        }
        history.push('/projects');
    };

    const handleCreateProject = () => {

        console.log('handleCreateProject')
        if (isGuest) {
            if (onItemClick) {
                onItemClick();
            }
            history.push('/projects');
            return;
        }

        if (!hasLumoPlus && projects.length >= 1) {
            projectLimitModal.openModal(true);
            return;
        }

        newProjectModal.openModal(true);
    };

    return (
        <div className="projects-sidebar-section">
            {isCollapsed ? (
                <Tooltip title={c('collider_2025:Button').t`Projects`} originalPlacement="right">
                    <button
                        className="sidebar-item"
                        onClick={handleProjectsHeaderClick}
                        aria-label={c('collider_2025:Button').t`Projects`}
                    >
                        <div className="sidebar-item-icon">
                            <Icon name="folder" size={4} className="rtl:mirror" />
                        </div>
                    </button>
                </Tooltip>
            ) : (
                <>
                    {/* Projects Header - Grok-style with visible chevron and create button */}
                    {isGuest ? (
                        // Guest mode: simple button that navigates to projects
                        <Tooltip title={c('collider_2025:Button').t`Projects`} originalPlacement="right">
                            <button
                                className={clsx(
                                    'sidebar-item projects-header-button flex-1',
                                    isProjectsPage && 'is-active',
                                    !showText && 'collapsed'
                                )}
                                onClick={handleProjectsHeaderClick}
                                aria-label={c('collider_2025:Button').t`Projects`}
                            >
                                <div className="sidebar-item-icon">
                                    <Icon name="folder" size={4} />
                                </div>
                                <span className={clsx('sidebar-item-text', !showText && 'hidden')}>
                                    {c('collider_2025:Button').t`Projects`}
                                    <DismissedFeaturePill featureId="projects" versionFlag="WhatsNewV1p3" />
                                </span>
                            </button>
                        </Tooltip>
                    ) : (
                        // Authenticated mode: expandable with chevron and create button
                        <>
                            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                            <div
                                className={clsx(
                                    'projects-header-container flex items-center gap-1',
                                    isProjectsPage && 'is-active'
                                )}
                                onClick={handleProjectsHeaderClick}
                                onMouseEnter={() => setIsHovered(true)}
                                onMouseLeave={() => setIsHovered(false)}
                                aria-label={c('collider_2025:Button').t`Projects`}
                            >
                                <div
                                    className={clsx(
                                        'sidebar-item projects-header-button flex-1',
                                        !showText && 'collapsed'
                                    )}
                                >
                                    <button
                                        className="projects-icon-button"
                                        onClick={handleToggle}
                                        aria-label={
                                            isExpanded
                                                ? c('collider_2025:Button').t`Collapse projects`
                                                : c('collider_2025:Button').t`Expand projects`
                                        }
                                        aria-expanded={isExpanded}
                                    >
                                        <div className="sidebar-item-icon projects-folder-icon">
                                            {!isHovered && showText && (
                                                <Icon
                                                    name="folder"
                                                    size={4}
                                                    className="rtl:mirror projects-folder-icon-default"
                                                />
                                            )}

                                            {isHovered && (
                                                <Icon
                                                    name={isExpanded ? 'chevron-down' : 'chevron-right'}
                                                    size={4}
                                                    className="projects-chevron-hover"
                                                />
                                            )}
                                        </div>
                                    </button>
                                    <div className="projects-text-div flex flex-nowrap items-center gap-2">
                                        <span className={clsx('sidebar-item-text', !showText && 'hidden')}>
                                            {c('collider_2025:Button').t`Projects`}
                                            <DismissedFeaturePill featureId="projects" versionFlag="WhatsNewV1p3" />
                                        </span>
                                    </div>

                                    {!isSmallScreen && showText && (
                                        <button
                                            className="projects-create-button"
                                            onClick={handleCreateProject}
                                            aria-label={c('collider_2025:Button').t`Create project`}
                                            title={c('collider_2025:Button').t`Create project`}
                                        >
                                            <Icon name="plus" size={3} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* Projects List - shown when expanded (only for authenticated users) */}
            {!isGuest && isExpanded && showText && (
                <div className="projects-list">
                    {projects.length > 0 && (
                        <div className="flex flex-column flex-nowrap gap-0 shrink-0">
                            {projects.slice(0, 5).map((project) => {
                            const category = getProjectCategory(project.icon);
                            const isSelected = currentProjectId === project.id;

                            return (
                                <li
                                    key={project.id}
                                    className={clsx(
                                        'relative group-hover-hide-container group-hover-opacity-container flex items-center shrink-0 navigation-link w-full',
                                        'hover:bg-weak rounded-md transition-colors',
                                        isSelected && 'is-active bg-norm-weak'
                                    )}
                                >
                                    <LumoLink
                                        to={`/projects/${project.id}`}
                                        className="flex items-center flex-1 px-3 py-2 text-sm text-ellipsis hover:text-primary"
                                        onClick={onItemClick}
                                    >
                                        <div className="project-icon-small color-norm mr-2 flex-shrink-0">
                                            <Icon name={category.icon as any} size={4} className="color-white" />
                                        </div>
                                        <span className="text-ellipsis flex-1" title={project.name}>
                                            {project.name}
                                        </span>
                                    </LumoLink>
                                    <div className="flex-shrink-0">
                                        <ProjectActionsDropdown project={project} />
                                    </div>
                                </li>
                            );
                        })}
                        </div>
                    )}
                    {projects.length > 5 && (
                        <button
                            className="project-sidebar-item-see-all flex items-center justify-center px-3 py-2 text-sm color-weak hover:color-norm transition-colors"
                            onClick={handleProjectsClick}
                        >
                            {c('collider_2025:Button').t`See all`}
                        </button>
                    )}

                    {projects.length === 0 && (
                        <div className="px-3 py-2 text-sm color-weak">{c('collider_2025:Info').t`No projects yet`}</div>
                    )}
                </div>
            )}

            {newProjectModal.render && <NewProjectModal {...newProjectModal.modalProps} />}
            {projectLimitModal.render && <ProjectLimitModal {...projectLimitModal.modalProps} />}
        </div>
    );
};
