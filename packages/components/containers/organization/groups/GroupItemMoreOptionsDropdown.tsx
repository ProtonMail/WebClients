import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import type { Group } from '@proton/shared/lib/interfaces';

import DeleteGroupPrompt from './DeleteGroupPrompt';
import GroupItemActionPrompt from './GroupItemActionPrompt';

interface Props {
    group: Group;
    showMailFeatures: boolean;
    handleDeleteGroup: () => Promise<void>;
    handleDeleteAllGroupMembers: () => Promise<void>;
    canOnlyDelete: boolean;
}

const GroupItemMoreOptionsDropdown = ({
    group,
    showMailFeatures,
    handleDeleteGroup,
    handleDeleteAllGroupMembers,
    canOnlyDelete,
}: Props) => {
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
                    group={group}
                    showMailFeatures={showMailFeatures}
                    onConfirm={handleDeleteGroup}
                    modalProps={deleteGroupPrompt.modalProps}
                />
            )}
            {!canOnlyDelete && (
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
            {canOnlyDelete && (
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
