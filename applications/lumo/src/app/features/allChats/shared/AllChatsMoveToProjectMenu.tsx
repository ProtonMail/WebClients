import type { RefObject } from 'react';

import { c } from 'ttag';

import type { DropdownProps } from '@proton/components/components/dropdown/Dropdown';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';

import { MenuDropdown } from '../../../components/Composer/components/MenuDropdown';
import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { ProjectIcon } from '../../../components/ProjectIcon/ProjectIcon';
import { useLumoStore } from '../../../redux/hooks';
import { selectSpaceMap } from '../../../redux/slices/core/spaces';
import { getProjectInfo } from '../../../types';
import { useProjects } from '../../projects/hooks/useProjects';
import { NewProjectModal } from '../../projects/modals/NewProjectModal';

import '../../../layouts/sidepanel/ConversationSidebarActions.scss';

interface Props {
    isOpen: boolean;
    anchorRef: RefObject<HTMLElement>;
    onClose: () => void;
    onSelect: (spaceId: string, projectName: string) => void;
    placement?: DropdownProps['originalPlacement'];
}

/** Web/Menu · Move to project: a heading, one row per project, then New project. */
export const AllChatsMoveToProjectMenu = ({
    isOpen,
    anchorRef,
    onClose,
    onSelect,
    placement = 'bottom-end',
}: Props) => {
    const projects = useProjects();
    const store = useLumoStore();
    const newProjectModal = useModalStateObject();

    return (
        <>
            <MenuDropdown isOpen={isOpen} anchorRef={anchorRef} onClose={onClose} placement={placement}>
                <div className="px-4 py-1 text-sm color-weak">{c('collider_2025:Title').t`Move to project`}</div>
                {projects.map((project) => {
                    return (
                        <DropdownMenuButton
                            key={project.id}
                            className="chat-menu-item flex flex-nowrap items-center gap-2"
                            onClick={() => {
                                onSelect(project.id, project.name);
                                onClose();
                            }}
                        >
                            <ProjectIcon iconId={project.icon} size={16} className="shrink-0" />
                            <span className="text-ellipsis text-left">{project.name}</span>
                        </DropdownMenuButton>
                    );
                })}
                <DropdownMenuButton
                    className="chat-menu-item flex flex-nowrap items-center gap-2"
                    onClick={() => {
                        onClose();
                        newProjectModal.openModal(true);
                    }}
                >
                    <LumoIcon name="FolderPlus" size={16} className="shrink-0" />
                    <span>{c('collider_2025:Action').t`New project`}</span>
                </DropdownMenuButton>
            </MenuDropdown>

            {newProjectModal.render ? (
                <NewProjectModal
                    {...newProjectModal.modalProps}
                    onProjectCreated={(spaceId) => {
                        // The new project is in the store by now; read its name for the result message.
                        const name =
                            getProjectInfo(selectSpaceMap(store.getState())[spaceId]).project?.projectName ||
                            c('collider_2025:Title').t`Untitled Project`;
                        onSelect(spaceId, name);
                    }}
                />
            ) : null}
        </>
    );
};
