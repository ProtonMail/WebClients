import { useState } from 'react';

import { c } from 'ttag';

import { useModalStateObject } from '@proton/components';

import { useLumoSelector } from '../../redux/hooks';
import { selectSpaceById } from '../../redux/selectors';
import type { ProjectSpace } from '../../types';
import DropdownMenu from '../../components/DropdownMenu';
import type { DropdownOptions } from '../../components/DropdownMenu';
import { DeleteProjectModal } from './modals/DeleteProjectModal';
import { ProjectEditModal } from './modals/ProjectEditModal';
import { useProjectActions } from './hooks/useProjectActions';
import type { Project } from './types';

interface ProjectActionsDropdownProps {
    project: Project;
}

export const ProjectActionsDropdown = ({ project }: ProjectActionsDropdownProps) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const space = useLumoSelector(selectSpaceById(project.spaceId || ''));
    const projectSpace = space?.isProject ? (space satisfies ProjectSpace) : undefined;
    const { deleteProject } = useProjectActions();

    const editModal = useModalStateObject();
    const deleteModal = useModalStateObject();

    const handleDelete = async () => {
        if (project.spaceId) {
            await deleteProject(project.spaceId);
        }
    };

    const toggleDropdown = () => {
        setIsDropdownOpen((prev) => !prev);
    };

    const options: DropdownOptions[] = [
        {
            label: c('collider_2025:Action').t`Edit project`,
            icon: 'pen',
            onClick: (e) => {
                e?.stopPropagation();
                setIsDropdownOpen(false);
                editModal.openModal(true);
            },
        },
        {
            label: c('collider_2025:Action').t`Delete project`,
            icon: 'trash',
            onClick: (e) => {
                e?.stopPropagation();
                setIsDropdownOpen(false);
                deleteModal.openModal(true);
            },
        },
    ];

    return (
        <>
            <DropdownMenu options={options} onToggle={toggleDropdown} isOpen={isDropdownOpen} />
            {editModal.render && projectSpace && (
                <ProjectEditModal
                    {...editModal.modalProps}
                    projectId={project.id}
                    currentName={project.name}
                    currentInstructions={projectSpace.projectInstructions}
                    currentIcon={projectSpace.projectIcon}
                    space={projectSpace}
                />
            )}
            {deleteModal.render && (
                <DeleteProjectModal
                    {...deleteModal.modalProps}
                    project={project}
                    onConfirmDelete={handleDelete}
                />
            )}
        </>
    );
};
