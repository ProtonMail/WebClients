import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Dropdown, DropdownMenu, DropdownMenuButton, Icon, usePopperAnchor } from '@proton/components';
import { IcFolderOpen } from '@proton/icons/icons/IcFolderOpen';
import { IcThreeDotsHorizontal } from '@proton/icons/icons/IcThreeDotsHorizontal';
import { IcTrash } from '@proton/icons/icons/IcTrash';

import { useProjectActions } from '../hooks/useProjectActions';

interface ProjectTitleSectionProps {
    projectName: string;
    categoryIcon: string;
    onSaveTitle: (newTitle: string) => void;
    onDeleteProject: () => void;
}

export const ProjectTitleSection = ({
    projectName,
    categoryIcon,
    onSaveTitle,
    onDeleteProject,
}: ProjectTitleSectionProps) => {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');
    const titleInputRef = useRef<HTMLInputElement>(null);
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const { navigateToAllProjects } = useProjectActions();

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
        <div className="project-detail-title-section flex items-center flex-nowrap w-full px-2 py-0">
            <Icon name={categoryIcon as any} size={6} className="project-detail-title-icon shrink-0" />
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
                <IcThreeDotsHorizontal />
            </Button>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close} className="chat-dropdown-menu">
                <DropdownMenu>
                    <DropdownMenuButton className="text-left" onClick={navigateToAllProjects}>
                        <IcFolderOpen className="mr-2" />
                        {c('collider_2025:Action').t`Go to all projects`}
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        className="text-left color-danger"
                        onClick={() => {
                            close();
                            onDeleteProject();
                        }}
                    >
                        <IcTrash className="mr-2" />
                        {c('collider_2025:Action').t`Delete project`}
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
        </div>
    );
};
