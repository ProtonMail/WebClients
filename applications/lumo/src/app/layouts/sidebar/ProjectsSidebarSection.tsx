import { useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { Icon, useModalStateObject } from '@proton/components';
import { IcFolderOpen } from '@proton/icons/icons/IcFolderOpen';
import { IcPlus } from '@proton/icons/icons/IcPlus';

import { DismissedFeaturePill } from '../../components/DismissedFeaturePill';
import { NewProjectModal, useProjects } from '../../features/projects';
import { ProjectActionsDropdown } from '../../features/projects/ProjectActionsDropdown';
import { getProjectCategory } from '../../features/projects/constants';
import { ProjectLimitModal } from '../../features/projects/modals/ProjectLimitModal';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useLumoPlan } from '../../providers/LumoPlanProvider';
import { useSidebar } from '../../providers/SidebarProvider';
import { CollapsibleSidebarSection } from './components/CollapsibleSidebarSection';
import { SidebarNavList } from './components/SidebarNavList';

import './ProjectsSidebarSection.scss';

interface ProjectsSidebarSectionProps {
    showText: boolean;
    onItemClick?: () => void;
}

export const ProjectsSidebarSection = ({ showText, onItemClick }: ProjectsSidebarSectionProps) => {
    const projects = useProjects();
    const history = useHistory();
    const location = useLocation();

    const isGuest = useIsGuest();
    const { hasLumoPlus } = useLumoPlan();
    const { isCollapsed, toggle } = useSidebar();
    const newProjectModal = useModalStateObject();
    const projectLimitModal = useModalStateObject();

    const currentProjectId = useMemo(() => {
        const match = location.pathname.match(/^\/projects\/([^/]+)/);
        return match ? match[1] : null;
    }, [location.pathname]);

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

    const handleCreateProject = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!hasLumoPlus && projects.length >= 1) {
            projectLimitModal.openModal(true);
            return;
        }

        newProjectModal.openModal(true);
    };

    return (
        <>
            {isGuest ? (
                <div className="projects-sidebar-section">
                    {isCollapsed ? (
                        <Tooltip title={c('collider_2025:Button').t`Projects`} originalPlacement="right">
                            <button
                                className="sidebar-item"
                                onClick={handleProjectsHeaderClick}
                                aria-label={c('collider_2025:Button').t`Projects`}
                            >
                                <div className="sidebar-item-icon">
                                    <IcFolderOpen size={4} className="rtl:mirror" />
                                </div>
                            </button>
                        </Tooltip>
                    ) : (
                        <Tooltip title={c('collider_2025:Button').t`Projects`} originalPlacement="right">
                            <button
                                className="sidebar-item projects-header-button"
                                onClick={handleProjectsHeaderClick}
                                aria-label={c('collider_2025:Button').t`Projects`}
                            >
                                <div className="sidebar-item-icon">
                                    <IcFolderOpen size={4} />
                                </div>
                                <span className="sidebar-item-text">
                                    {c('collider_2025:Button').t`Projects`}
                                    <DismissedFeaturePill featureId="projects" versionFlag="WhatsNewV1p3" />
                                </span>
                            </button>
                        </Tooltip>
                    )}
                </div>
            ) : (
                <CollapsibleSidebarSection
                    label={c('collider_2025:Button').t`Projects`}
                    icon={<IcFolderOpen size={4} className="rtl:mirror" />}
                    showText={showText}
                    onHeaderClick={handleProjectsHeaderClick}
                    labelExtra={<DismissedFeaturePill featureId="projects" versionFlag="WhatsNewV1p3" />}
                    actionButton={
                        <button
                            className="projects-create-button"
                            onClick={handleCreateProject}
                            aria-label={c('collider_2025:Button').t`Create project`}
                            title={c('collider_2025:Button').t`Create project`}
                        >
                            <IcPlus size={3} />
                        </button>
                    }
                    className="projects-sidebar-section"
                >
                    <div className="projects-list">
                        {projects.length > 0 && (
                            <SidebarNavList
                                items={projects.slice(0, 5).map((project) => {
                                    const category = getProjectCategory(project.icon);
                                    return {
                                        id: project.id,
                                        to: `/projects/${project.id}`,
                                        label: project.name,
                                        isSelected: currentProjectId === project.id,
                                        leadingContent: (
                                            <div className="project-icon-small color-norm flex-shrink-0">
                                                <Icon name={category.icon as any} size={4} className="color-white" />
                                            </div>
                                        ),
                                        trailingContent: <ProjectActionsDropdown project={project} />,
                                    };
                                })}
                                onItemClick={onItemClick}
                            />
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
                            <div className="px-3 py-2 text-sm color-weak">
                                {c('collider_2025:Info').t`No projects yet`}
                            </div>
                        )}
                    </div>
                </CollapsibleSidebarSection>
            )}
            {newProjectModal.render && <NewProjectModal {...newProjectModal.modalProps} />}
            {projectLimitModal.render && <ProjectLimitModal {...projectLimitModal.modalProps} />}
        </>
    );
};
