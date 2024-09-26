import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import Icon from '@proton/components/components/icon/Icon';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import type { Group } from '@proton/shared/lib/interfaces';

import GroupItemActionPrompt from './GroupItemActionPrompt';

interface Props {
    group: Group;
    handleDeleteGroup: () => Promise<void>;
    handleDeleteAllGroupMembers: () => Promise<void>;
    canOnlyDelete: boolean;
}

const GroupItemMoreOptionsDropdown = ({
    group,
    handleDeleteGroup,
    handleDeleteAllGroupMembers,
    canOnlyDelete,
}: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const deleteGroupPrompt = useModalStateObject();
    const removeAllMembersPrompt = useModalStateObject();
    const displayGroupName = (
        <strong key="group-name" className="text-break">
            {group.Name}
        </strong>
    );

    const displayGroupAddressEmail = (
        <strong key="group-email" className="text-break">
            {group.Address.Email}
        </strong>
    );

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
                <GroupItemActionPrompt
                    title={c('Title').t`Delete group?`}
                    buttonTitle={c('Action').t`Delete group`}
                    children={
                        <>
                            {c('Delete group prompt')
                                .jt`Please note that if you delete the group ${displayGroupName} (with address ${displayGroupAddressEmail}), you will no longer be able to receive emails using its address.`}
                            <br />
                            <br />
                            {c('Delete group prompt').t`Are you sure you want to delete this group?`}
                        </>
                    }
                    onConfirm={handleDeleteGroup}
                    {...deleteGroupPrompt.modalProps}
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
                    <Icon name="three-dots-vertical" alt={c('Action').t`More options`} />
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
                    <Icon name="trash" alt={c('Action').t`Delete group`} />
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
