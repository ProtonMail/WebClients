import { useState, useMemo, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Icon, useModalStateObject } from '@proton/components';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';

import { useIsGuest } from '../../providers/IsGuestProvider';
import { useSidebar } from '../../providers/SidebarProvider';
import { useProjects } from '../projects';
import { getProjectCategory } from '../projects/constants';
import { NewProjectModal } from '../projects/modals/NewProjectModal';
import { LumoLink } from '../../components/LumoLink';

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
    const { isCollapsed, isVisible, isSmallScreen, toggle } = useSidebar();
    const newProjectModal = useModalStateObject();

    // Collapse Projects section when sidebar starts collapsing, expand when sidebar expands
    // On mobile, expand when sidebar is visible (overlay mode)
    useEffect(() => {
        if (isSmallScreen) {
            // On mobile, expand when sidebar is visible
            setIsExpanded(isVisible);
        } else if (isCollapsed) {
            // Collapse Projects section immediately when sidebar starts collapsing
            setIsExpanded(false);
        } else {
            // Expand Projects section after a short delay when sidebar expands
            const timer = setTimeout(() => {
                setIsExpanded(true);
            }, 200); // Delay to allow sidebar expansion animation to start
            return () => clearTimeout(timer);
        }
    }, [isCollapsed, isVisible, isSmallScreen]);

    // Determine if we're currently viewing a project
    const currentProjectId = useMemo(() => {
        const match = location.pathname.match(/^\/projects\/([^/]+)/);
        return match ? match[1] : null;
    }, [location.pathname]);

    // Determine if we're on the projects list page
    const isProjectsPage = location.pathname === '/projects';

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    const handleProjectsHeaderClick = () => {
        if (isGuest) {
            // For guests, always navigate to projects page
            if (onItemClick) {
                onItemClick();
            }
            history.push('/projects');
            return;
        }

        if (isCollapsed) {
            // When collapsed, expand the sidebar
            toggle();
        } else {
            // When expanded, navigate to projects page
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
        if (isGuest) {
            // For guests, navigate to projects page which will show sign-in prompt
            if (onItemClick) {
                onItemClick();
            }
            history.push('/projects');
            return;
        }

        if (onItemClick) {
            onItemClick();
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
                                    <Icon name="folder" size={4} className="rtl:mirror" />
                                </div>
                                <span className={clsx('sidebar-item-text', !showText && 'hidden')}>
                                    {c('collider_2025:Button').t`Projects`}
                                </span>
                            </button>
                        </Tooltip>
                    ) : (
                        // Authenticated mode: expandable with chevron and create button
                        <div
                            className={clsx(
                                'projects-header-container flex items-center gap-1',
                                isProjectsPage && 'is-active'
                            )}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
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
                                    aria-label={isExpanded ? c('collider_2025:Button').t`Collapse projects` : c('collider_2025:Button').t`Expand projects`}
                                    aria-expanded={isExpanded}
                                >
                                    <div className="sidebar-item-icon projects-folder-icon">
                                        {!isHovered && showText && (
                                            <Icon name="folder" size={4} className="rtl:mirror projects-folder-icon-default" />
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
                                <button
                                    className="projects-text-button"
                                    onClick={handleProjectsHeaderClick}
                                    aria-label={c('collider_2025:Button').t`Projects`}
                                >
                                    <span className={clsx('sidebar-item-text', !showText && 'hidden')}>
                                        {c('collider_2025:Button').t`Projects`}
                                    </span>
                                </button>

                                {showText && (
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
                    )}
                </>
            )}

            {/* Projects List - shown when expanded (only for authenticated users) */}
            {!isGuest && isExpanded && showText && projects.length > 0 && (
                <div className="projects-list">
                    {projects.slice(0, 5).map((project) => {
                        const category = getProjectCategory(project.icon);
                        const isSelected = currentProjectId === project.id;

                        return (
                            <LumoLink
                                key={project.id}
                                to={`/projects/${project.id}`}
                                className={clsx(
                                    'project-sidebar-item',
                                    isSelected && 'is-active',
                                    'flex items-center gap-2 px-3 py-2 rounded-md hover:bg-weak transition-colors'
                                )}
                                onClick={onItemClick}
                            >
                                <div
                                    className="project-icon-small"
                                    style={{
                                        backgroundColor: category.color,
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <Icon name={category.icon as any} size={3} className="color-white" />
                                </div>
                                <span className="flex-1 text-ellipsis text-sm" title={project.name}>
                                    {project.name}
                                </span>
                                {(project.fileCount !== undefined || project.conversationCount !== undefined) && (
                                    <div className="flex items-center gap-1 text-xs color-weak flex-shrink-0">
                                        {project.fileCount !== undefined && project.fileCount > 0 && (
                                            <span className="flex items-center gap-0.5">
                                                <Icon name="paper-clip" size={2.5} />
                                                {project.fileCount}
                                            </span>
                                        )}
                                        {project.conversationCount !== undefined && project.conversationCount > 0 && (
                                            <span className="flex items-center gap-0.5">
                                                <Icon name="speech-bubble" size={2.5} />
                                                {project.conversationCount}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </LumoLink>
                        );
                    })}
                    {projects.length > 5 && (
                        <button
                            className="project-sidebar-item-see-all flex items-center justify-center px-3 py-2 text-sm color-weak hover:color-norm transition-colors"
                            onClick={handleProjectsClick}
                        >
                            {c('collider_2025:Button').t`See all`}
                        </button>
                    )}
                </div>
            )}

            {/* Empty state when expanded (only for authenticated users) */}
            {!isGuest && isExpanded && showText && projects.length === 0 && (
                <div className="projects-empty px-3 py-2 text-sm color-weak">
                    {c('collider_2025:Info').t`No projects yet`}
                </div>
            )}

            {/* New Project Modal */}
            {newProjectModal.render && <NewProjectModal {...newProjectModal.modalProps} />}
        </div>
    );
};

