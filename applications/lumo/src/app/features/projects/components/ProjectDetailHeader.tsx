import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcArrowLeft } from '@proton/icons/icons/IcArrowLeft';

import ProjectSettingsButton from '../ProjectSettingsButton';
import { ProjectTitleSection } from './ProjectTitleSection';

interface ProjectDetailHeaderProps {
    projectName: string;
    category: { icon: string };
    showSidebar: boolean;
    isMobileView: boolean;
    onBack: () => void;
    onProjectSettingsClick: () => void;
    onSaveTitle: (newTitle: string) => void;
    onDeleteProject: () => void;
}

export const ProjectDetailHeader = ({
    projectName,
    category,
    showSidebar,
    isMobileView,
    onBack,
    onProjectSettingsClick,
    onSaveTitle,
    onDeleteProject,
}: ProjectDetailHeaderProps) => {
    return (
        <div
            className={clsx(
                'project-detail-header flex flex-nowrap items-baseline',
                showSidebar ? 'with-sidebar' : 'without-sidebar'
            )}
        >
            <div className="project-detail-header-content flex flex-column w-full">
                <div className="flex flex-row flex-nowrap justify-space-between">
                    <Button
                        shape="ghost"
                        onClick={onBack}
                        className="project-detail-back-button flex items-center px-0"
                        title={c('collider_2025:Action').t`Back to projects`}
                    >
                        <IcArrowLeft className="mr-1" />
                        <span className="project-detail-back-text">
                            {c('collider_2025:Navigation').t`All projects`}
                        </span>
                    </Button>

                    <div className="project-detail-actions flex">
                        <ProjectSettingsButton
                            onClick={onProjectSettingsClick}
                            showSidebar={showSidebar}
                            isMobileView={isMobileView}
                        />
                    </div>
                </div>
                <ProjectTitleSection
                    projectName={projectName}
                    categoryIcon={category.icon}
                    onSaveTitle={onSaveTitle}
                    onDeleteProject={onDeleteProject}
                />
            </div>
        </div>
    );
};
