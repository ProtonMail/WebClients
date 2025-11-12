import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Icon, SettingsLink, useModalStateObject } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { EXAMPLE_PROJECTS } from './exampleProjects';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useLumoPlan } from '../../providers/LumoPlanProvider';
import { useProjects } from './hooks/useProjects';
import { NewProjectModal } from './modals/NewProjectModal';
import { ProjectCard } from './ProjectCard';
import { ProjectLimitModal } from './modals/ProjectLimitModal';
import type { Project } from './types';

import './ProjectsView.scss';

type Tab = 'my-projects' | 'shared' | 'examples';

export const ProjectsView = () => {
    const [activeTab, setActiveTab] = useState<Tab>('my-projects');
    const isGuest = useIsGuest();
    const { hasLumoPlus } = useLumoPlan();
    const newProjectModal = useModalStateObject();
    const projectLimitModal = useModalStateObject();
    const myProjects = useProjects();
    // TODO: Implement shared projects when collaboration features are added
    const sharedProjects: Project[] = [];

    const handleCreateProject = () => {
        if (isGuest) {
            // Guest users cannot create projects - they must sign in
            return;
        }

        // Free users are limited to 1 project
        if (!hasLumoPlus && myProjects.length >= 1) {
            projectLimitModal.openModal(true);
            return;
        }

        newProjectModal.openModal(true);
    };

    const renderContent = () => {
        if (activeTab === 'my-projects') {
            // Guest users - show sign-in prompt
            if (isGuest) {
                return (
                    <div className="projects-empty-state">
                        <div className="projects-empty-icon">
                            <Icon name="lock" size={6} />
                        </div>
                        <h2 className="projects-empty-title">
                            {c('collider_2025:Title').t`Sign in to create projects`}
                        </h2>
                        <p className="projects-empty-description">
                            {c('collider_2025:Info')
                                .t`Projects help you organize conversations with custom instructions and files. Sign in or create a free account to get started.`}
                        </p>
                        <div className="flex flex-column gap-2 items-center mt-4" style={{ maxWidth: '20rem' }}>
                            <ButtonLike
                                as={SettingsLink}
                                color="norm"
                                shape="solid"
                                path="/signup"
                                className="w-full"
                            >
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

            if (myProjects.length === 0) {
                return (
                    <div className="projects-empty-state">
                        <div className="projects-empty-icon">
                            <Icon name="folder" />
                        </div>
                        <h2 className="projects-empty-title">
                            {c('collider_2025:Title').t`Get started by creating a new project`}
                        </h2>
                        <p className="projects-empty-description">
                            {c('collider_2025:Info').t`Projects help you set common instructions and attach files for conversations.`}
                        </p>
                        <Button color="norm" onClick={handleCreateProject} className="mt-4">
                            <Icon name="plus" className="mr-2" />
                            {c('collider_2025:Button').t`New project`}
                        </Button>
                    </div>
                );
            }
            return (
                <div className="projects-grid">
                    {myProjects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            );
        }

        if (activeTab === 'shared') {
            if (sharedProjects.length === 0) {
                return (
                    <div className="projects-empty-state">
                        <div className="projects-empty-icon">
                            <Icon name="users" />
                        </div>
                        <p className="projects-empty-description">
                            {c('collider_2025:Info').t`No files yet`}
                        </p>
                        <p className="projects-empty-subdescription">
                            {c('collider_2025:Info').t`Try attaching files to your project. They will be used in all chats in this project.`}
                        </p>
                    </div>
                );
            }
            return (
                <div className="projects-grid">
                    {sharedProjects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            );
        }

        // Examples tab
        return (
            <div className="projects-grid">
                {EXAMPLE_PROJECTS.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                ))}
            </div>
        );
    };

    return (
        <>
            <div className="projects-view">
                <div className="projects-header">
                    <h1 className="projects-title">{c('collider_2025:Title').t`Projects`}</h1>
                    <Button color="norm" onClick={handleCreateProject} disabled={isGuest}>
                        <Icon name="plus" className="mr-2" />
                        {c('collider_2025:Button').t`Create project`}
                    </Button>
                </div>

                <div className="projects-tabs">
                    <button
                        className={clsx('projects-tab', activeTab === 'my-projects' && 'projects-tab--active')}
                        onClick={() => setActiveTab('my-projects')}
                    >
                        {c('collider_2025:Tab').t`My Projects`}
                    </button>
                    <button
                        className={clsx('projects-tab', activeTab === 'examples' && 'projects-tab--active')}
                        onClick={() => setActiveTab('examples')}
                    >
                        {c('collider_2025:Tab').t`Templates`}
                    </button>
                </div>

                <div className="projects-content">{renderContent()}</div>
            </div>

            {newProjectModal.render && <NewProjectModal {...newProjectModal.modalProps} />}
            {projectLimitModal.render && <ProjectLimitModal {...projectLimitModal.modalProps} />}
        </>
    );
};

