import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import { Dropdown, DropdownMenu, DropdownMenuButton } from '@proton/components';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { ProjectIcon } from '../../../components/ProjectIcon/ProjectIcon';
import { useUncontrolledField } from '../../../hooks/useUncontrolledField';
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
    const titleField = useUncontrolledField<HTMLInputElement>(projectName);
    const titleInputRef = titleField.bind.ref;
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const { navigateToAllProjects } = useProjectActions();

    useEffect(() => {
        if (isEditingTitle && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
    }, [isEditingTitle, titleInputRef]);

    const handleStartEditing = () => {
        setIsEditingTitle(true);
    };

    const handleSave = () => {
        const trimmedTitle = titleField.getValue().trim();
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
        }
    };

    return (
        <div className="project-detail-title-section flex items-center flex-nowrap w-full px-2 py-0">
            <ProjectIcon iconId={categoryIcon} size={24} className="project-detail-title-icon shrink-0" />
            {isEditingTitle ? (
                <input
                    {...titleField.bind}
                    // Remount per edit (conditional render) keeps defaultValue in sync with the latest name
                    defaultValue={projectName}
                    type="text"
                    className="project-detail-title-input text-2xl"
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
                <LumoIcon name="Ellipsis" size={16} />
            </Button>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close} className="chat-dropdown-menu">
                <DropdownMenu>
                    <DropdownMenuButton
                        className="text-left flex flex-nowrap items-center"
                        onClick={navigateToAllProjects}
                    >
                        <LumoIcon name="FolderOpen" size={16} className="mr-2" />
                        {c('collider_2025:Action').t`Go to all projects`}
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        className="text-left color-danger flex flex-nowrap items-center"
                        onClick={() => {
                            close();
                            onDeleteProject();
                        }}
                    >
                        <LumoIcon name="Trash" size={16} className="mr-2" />
                        {c('collider_2025:Action').t`Delete project`}
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
        </div>
    );
};
