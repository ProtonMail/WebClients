import { useEffect, useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Dropdown, DropdownMenu, DropdownMenuButton, Icon, usePopperAnchor } from '@proton/components';

import ProjectSettingsButton from '../ProjectSettingsButton';

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
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');
    const titleInputRef = useRef<HTMLInputElement>(null);
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    useEffect(() => {
        if (isEditingTitle && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
    }, [isEditingTitle]);

    const handleStartEditing = () => {
        setEditedTitle(projectName);
        setIsEditingTitle(true);
    };

    const handleSave = () => {
        const trimmedTitle = editedTitle.trim();
        if (trimmedTitle && trimmedTitle !== projectName) {
            onSaveTitle(trimmedTitle);
        }
        setIsEditingTitle(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            setIsEditingTitle(false);
            setEditedTitle(projectName);
        }
    };

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
                        <Icon name="arrow-left" className="mr-1" />
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

                <div className="project-detail-title-section flex items-center flex-nowrap w-full">
                    <Icon name={category.icon as any} size={6} className="project-detail-title-icon shrink-0" />
                    {isEditingTitle ? (
                        <input
                            ref={titleInputRef}
                            type="text"
                            className="project-detail-title-input text-2xl"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={handleKeyDown}
                            maxLength={100}
                        />
                    ) : (
                        <>
                            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
                            <h1
                                className="project-detail-title text-2xl text-ellipsis"
                                onClick={handleStartEditing}
                                title={c('collider_2025:Action').t`Click to edit title`}
                            >
                                {projectName}
                            </h1>
                        </>
                    )}
                    <Button
                        ref={anchorRef}
                        icon
                        shape="ghost"
                        onClick={toggle}
                        title={c('collider_2025:Action').t`More options`}
                    >
                        <Icon name="three-dots-horizontal" />
                    </Button>
                    <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close} className="chat-dropdown-menu">
                        <DropdownMenu>
                            <DropdownMenuButton
                                className="text-left color-danger"
                                onClick={() => {
                                    close();
                                    onDeleteProject();
                                }}
                            >
                                <Icon name="trash" className="mr-2" />
                                {c('collider_2025:Action').t`Delete project`}
                            </DropdownMenuButton>
                        </DropdownMenu>
                    </Dropdown>
                </div>
            </div>
        </div>
    );
};
