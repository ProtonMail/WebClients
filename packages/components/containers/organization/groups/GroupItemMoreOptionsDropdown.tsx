import { c } from 'ttag';

import { getIsScimGroup } from '@proton/account/groups/groupFlags';
import { Button } from '@proton/atoms/Button/Button';
import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import type { Group } from '@proton/shared/lib/interfaces';

import DeleteGroupPrompt from './DeleteGroupPrompt';
import { useGroupsManagement } from './context/GroupsManagementContext';
import { GROUPS_RESTRICTION_REASON } from './types';

interface Props {
    group: Group;
    showMailFeatures: boolean;
    handleDeleteGroup: () => Promise<void>;
}

const GroupItemMoreOptionsDropdown = ({ group, showMailFeatures, handleDeleteGroup }: Props) => {
    const { restrictedBy, selectedGroup } = useGroupsManagement();
    const isScimGroup = getIsScimGroup(group);
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const deleteGroupPrompt = useModalStateObject();

    const isResumingRoleAssignment =
        restrictedBy.reason === GROUPS_RESTRICTION_REASON.RESUMING_ROLE_ASSIGNMENT && restrictedBy.groupId === group.ID;
    const isDeleteGroupDisabled = isResumingRoleAssignment || isScimGroup;
    return (
        <>
            {deleteGroupPrompt.render && (
                <DeleteGroupPrompt
                    group={selectedGroup!}
                    showMailFeatures={showMailFeatures}
                    onConfirm={handleDeleteGroup}
                    modalProps={deleteGroupPrompt.modalProps}
                />
            )}
            {restrictedBy.reason === GROUPS_RESTRICTION_REASON.PLAN_UNSUPPORTED ? (
                <Button
                    shape="ghost"
                    size="small"
                    icon
                    onClick={() => deleteGroupPrompt.openModal(true)}
                    title={c('Action').t`Delete group`}
                >
                    <IcTrash alt={c('Action').t`Delete group`} />
                </Button>
            ) : (
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

            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close} originalPlacement="bottom-start">
                <DropdownMenu>
                    <DropdownMenuButton
                        disabled={isDeleteGroupDisabled}
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
