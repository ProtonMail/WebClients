import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical';
import { IcTrash } from '@proton/icons/icons/IcTrash';

import DeleteGroupPrompt from './DeleteGroupPrompt';
import GroupItemActionPrompt from './GroupItemActionPrompt';
import { useGroupsManagement } from './context/GroupsManagementContext';

interface Props {
    showMailFeatures: boolean;
    handleDeleteGroup: () => Promise<void>;
    handleDeleteAllGroupMembers: () => Promise<void>;
}

const GroupItemMoreOptionsDropdown = ({ showMailFeatures, handleDeleteGroup, handleDeleteAllGroupMembers }: Props) => {
    const { isFrozen, selectedGroup } = useGroupsManagement();
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const deleteGroupPrompt = useModalStateObject();
    const removeAllMembersPrompt = useModalStateObject();

    return (
        <>
            {removeAllMembersPrompt.render && (
                <GroupItemActionPrompt
                    title={c('Title').t`Remove all members?`}
                    buttonTitle={c('Action').t`Remove all members`}
                    children={c('Info').t`Are you sure you want to remove all members from this group?`}
                    onConfirm={handleDeleteAllGroupMembers}
                    {...removeAllMembersPrompt.modalProps}
                />
            )}
            {deleteGroupPrompt.render && (
                <DeleteGroupPrompt
                    group={selectedGroup!}
                    showMailFeatures={showMailFeatures}
                    onConfirm={handleDeleteGroup}
                    modalProps={deleteGroupPrompt.modalProps}
                />
            )}
            {!isFrozen && (
                <Button
                    shape="ghost"
                    size="small"
                    icon
                    ref={anchorRef}
                    onClick={toggle}
                    title={c('Action').t`More options`}
                    aria-expanded={isOpen}
                >
                    <IcThreeDotsVertical alt={c('Action').t`More options`} />
                </Button>
            )}
            {isFrozen && (
                <Button
                    shape="ghost"
                    size="small"
                    icon
                    onClick={() => deleteGroupPrompt.openModal(true)}
                    title={c('Action').t`Delete group`}
                >
                    <IcTrash alt={c('Action').t`Delete group`} />
                </Button>
            )}
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close} originalPlacement="bottom-start">
                <DropdownMenu>
                    <DropdownMenuButton
                        className="text-left color-danger"
                        onClick={() => {
                            deleteGroupPrompt.openModal(true);
                        }}
                    >
                        {c('Action').t`Delete group`}
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

export default GroupItemMoreOptionsDropdown;
