import { c } from 'ttag';

import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';

import type { DropdownOptions } from '../../components/DropdownMenu';
import DropdownMenu from '../../components/DropdownMenu';
import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { ConversationExportModal } from '../../components/Modals/ConversationExportModal/ConversationExportModal';
import { isBulkConversationExportSupported } from '../../redux/bulkConversationExport';
import { useLumoSelector } from '../../redux/hooks';
import { selectSpaceById } from '../../redux/selectors';
import type { ProjectSpace } from '../../types';
import { SpaceType } from '../../types';
import { useProjectActions } from './hooks/useProjectActions';
import { DeleteProjectModal } from './modals/DeleteProjectModal';
import { ProjectEditModal } from './modals/ProjectEditModal';
import type { Project } from './types';

import '../../layouts/sidepanel/ConversationSidebarActions.scss';

interface ProjectActionsDropdownProps {
    project: Project;
}

export const ProjectActionsDropdown = ({ project }: ProjectActionsDropdownProps) => {
    const space = useLumoSelector(selectSpaceById(project.spaceId || ''));
    const projectSpace = space?.spaceType === SpaceType.Project ? (space satisfies ProjectSpace) : undefined;
    const { deleteProject } = useProjectActions();
    const editModal = useModalStateObject();
    const exportModal = useModalStateObject();
    const deleteModal = useModalStateObject();

    const handleDelete = async () => {
        if (project.spaceId) {
            await deleteProject(project.spaceId);
        }
    };

    const options: DropdownOptions[] = [
        {
            label: c('collider_2025:Action').t`Edit project`,
            icon: <LumoIcon name="Pen" size={16} />,
            className: 'chat-menu-item',
            onClick: (event) => {
                event?.stopPropagation();
                editModal.openModal(true);
            },
        },
        // Project exports are desktop only, see isBulkConversationExportSupported.
        ...(isBulkConversationExportSupported()
            ? [
                  {
                      // translator: Option in a project menu that downloads all chats in that project.
                      label: c('collider_2025:Option').t`Export`,
                      className: 'chat-menu-item',
                      icon: <LumoIcon name="SquareArrowRightExit" size={16} />,
                      disabled: !project.spaceId,
                      onClick: () => {
                          exportModal.openModal(true);
                      },
                  },
              ]
            : []),
        {
            label: c('collider_2025:Action').t`Delete project`,
            icon: <LumoIcon name="Trash" size={16} />,
            className: 'chat-menu-item chat-menu-item--danger',
            onClick: (event) => {
                event?.stopPropagation();
                deleteModal.openModal(true);
            },
        },
    ];

    return (
        <>
            <DropdownMenu className="radius-8" options={options} />
            {exportModal.render && project.spaceId && (
                <ConversationExportModal
                    {...exportModal.modalProps}
                    project={{ id: project.spaceId, title: project.name }}
                />
            )}
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
