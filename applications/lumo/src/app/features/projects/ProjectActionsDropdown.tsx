import { c } from 'ttag';

import { useModalStateObject } from '@proton/components';

import DropdownMenu from '../../components/DropdownMenu';
import type { DropdownOptions } from '../../components/DropdownMenu';
import { useLumoSelector } from '../../redux/hooks';
import { selectSpaceById } from '../../redux/selectors';
import type { ProjectSpace } from '../../types';
import { useProjectActions } from './hooks/useProjectActions';
import { DeleteProjectModal } from './modals/DeleteProjectModal';
import { ProjectEditModal } from './modals/ProjectEditModal';
import type { Project } from './types';

interface ProjectActionsDropdownProps {
    project: Project;
}

export const ProjectActionsDropdown = ({ project }: ProjectActionsDropdownProps) => {
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

    const options: DropdownOptions[] = [
        {
            label: c('collider_2025:Action').t`Edit project`,
            icon: 'pen',
            onClick: (e) => {
                e?.stopPropagation();
                editModal.openModal(true);
            },
        },
        {
            label: c('collider_2025:Action').t`Delete project`,
            icon: 'trash',
            onClick: (e) => {
                e?.stopPropagation();
                deleteModal.openModal(true);
            },
        },
    ];

    return (
        <>
            <DropdownMenu options={options} onToggle={() => {}} />
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
                <DeleteProjectModal {...deleteModal.modalProps} project={project} onConfirmDelete={handleDelete} />
            )}
        </>
    );
};
