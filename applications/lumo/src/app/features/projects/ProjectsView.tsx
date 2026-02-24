import { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Icon, SettingsLink, useModalStateObject } from '@proton/components';
import lumoProjects from '@proton/styles/assets/img/lumo/lumo-projects.svg';

import { useIsGuest } from '../../providers/IsGuestProvider';
import { useLumoPlan } from '../../providers/LumoPlanProvider';
import { useSidebar } from '../../providers/SidebarProvider';
import { HeaderWrapper } from '../../layouts/header/HeaderWrapper';
import { ProjectCard } from './ProjectCard';
import { EXAMPLE_PROJECTS } from './exampleProjects';
import { useProjects } from './hooks/useProjects';
import { NewProjectModal } from './modals/NewProjectModal';
import { ProjectLimitModal } from './modals/ProjectLimitModal';

import './ProjectsView.scss';

const getRandomProjects = (count: number) => {
    const shuffled = [...EXAMPLE_PROJECTS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
};

export const ProjectsView = () => {
    const history = useHistory();
    const isGuest = useIsGuest();
    const { hasLumoPlus } = useLumoPlan();
    const newProjectModal = useModalStateObject();
    const projectLimitModal = useModalStateObject();
    const myProjects = useProjects();
    const { isSmallScreen } = useSidebar();
    const [templateData, setTemplateData] = useState<{ name: string; instructions: string; icon: string } | null>(null);
    const randomProjects = useMemo(() => getRandomProjects(3), []);

    const handleCreateProject = () => {
        if (isGuest) {
            return;
        }

        if (!hasLumoPlus && myProjects.length >= 1) {
            projectLimitModal.openModal(true);
            return;
        }

        setTemplateData(null);
        newProjectModal.openModal(true);
    };

    const handleOpenTemplateModal = (name: string, instructions: string, icon: string) => {
        setTemplateData({ name, instructions, icon });
        newProjectModal.openModal(true);
    };

    const handleProjectCreated = (projectId: string) => {
        if (projectId) {
            history.push(`/projects/${projectId}`);
        }
    };

    const renderContent = () => {
        if (isGuest) {
            return (
                <div className="projects-empty-state">
                    <div className="projects-empty-icon">
                        <img src={lumoProjects} alt="Projects" width={300} />
                    </div>
                    <h2 className="projects-empty-title">{c('collider_2025:Title').t`Sign in to create projects`}</h2>
                    <p className="projects-empty-description">
                        {c('collider_2025:Info')
                            .t`Projects help you organize conversations with custom instructions and files. Sign in or create a free account to get started.`}
                    </p>
                    <div className="flex flex-column gap-2 items-center mt-4" style={{ maxWidth: '20rem' }}>
                        <ButtonLike as={SettingsLink} color="norm" shape="solid" path="/signup" className="w-full">
                            {c('collider_2025:Button').t`Create a free account`}
                        </ButtonLike>
                        <ButtonLike as={SettingsLink} path="" shape="outline" color="weak" className="w-full">
                            {c('collider_2025:Button').t`Sign in`}
                        </ButtonLike>
                    </div>
                    <p className="text-sm color-weak mt-4">
                        <Icon name="lock" size={3} className="mr-1" />
                        {c('collider_2025:Info').t`Your information is zero-access encrypted`}
                    </p>
                </div>
            );
        }

        if (myProjects.length > 0) {
            return (
                <>
                    <div className="projects-grid-wrapper">
                        <div className="projects-grid">
                            {myProjects.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                    </div>
                    <div className="projects-inspiration-section projects-inspiration-section--with-projects overflow-x-auto py-2">
                        <h2 className="projects-inspiration-title">{c('collider_2025:Title').t`Inspiration`}</h2>
                        <div className="projects-grid projects-grid--inspiration">
                            {randomProjects.map((project) => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    onOpenNewProjectModal={handleOpenTemplateModal}
                                />
                            ))}
                        </div>
                    </div>
                </>
            );
        }

        return (
            <>
                <div className="projects-empty-state-wrapper">
                    <div className="projects-empty-state">
                        <div className="projects-empty-icon">
                            <img src={lumoProjects} alt="Projects" width={300} />
                        </div>
                        <h2 className="projects-empty-title">
                            {c('collider_2025:Title').t`Get started by creating a new project`}
                        </h2>
                        <p className="projects-empty-description">
                            {c('collider_2025:Info')
                                .t`Projects help you organize conversations with custom instructions and files.`}
                        </p>
                    </div>
                </div>
                <div className="projects-inspiration-section">
                    <h2 className="projects-inspiration-title">{c('collider_2025:Title').t`Inspiration`}</h2>
                    <div className="projects-grid projects-grid--inspiration overflow-x-auto py-2">
                        {randomProjects.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onOpenNewProjectModal={handleOpenTemplateModal}
                            />
                        ))}
                    </div>
                </div>
            </>
        );
    };

    return (
        <>
            <div className="projects-view">
                {isSmallScreen && (
                    <HeaderWrapper>
                        <div />
                    </HeaderWrapper>
                )}
                <div className="projects-header">
                    <h1 className="projects-title">{c('collider_2025:Title').t`Projects`}</h1>
                    <Button color="norm" onClick={handleCreateProject} disabled={isGuest}>
                        <span className="flex items-center flex-nowrap">
                            <Icon name="plus" className="mr-2" />
                            {c('collider_2025:Button').t`New project`}
                        </span>
                    </Button>
                </div>

                <div className="projects-content">{renderContent()}</div>
            </div>

            {newProjectModal.render && (
                <NewProjectModal
                    {...newProjectModal.modalProps}
                    initialName={templateData?.name}
                    initialInstructions={templateData?.instructions}
                    initialIcon={templateData?.icon}
                    onProjectCreated={handleProjectCreated}
                />
            )}
            {projectLimitModal.render && <ProjectLimitModal {...projectLimitModal.modalProps} />}
        </>
    );
};
