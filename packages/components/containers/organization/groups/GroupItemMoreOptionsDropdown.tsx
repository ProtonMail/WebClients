import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useModalStateObject, usePopperAnchor } from '@proton/components/components';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import Icon from '@proton/components/components/icon/Icon';

import GroupItemActionPrompt from './GroupItemActionPrompt';

interface Props {
    handleDeleteGroup: () => Promise<void>;
    handleDeleteAllGroupMembers: () => Promise<void>;
}

const GroupItemMoreOptionsDropdown = ({ handleDeleteGroup, handleDeleteAllGroupMembers }: Props) => {
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
                <GroupItemActionPrompt
                    title={c('Title').t`Delete group?`}
                    buttonTitle={c('Action').t`Delete group`}
                    children={c('Info')
                        .t`Are you sure you want to delete this group. The group address won't be working anymore.`}
                    onConfirm={handleDeleteGroup}
                    {...deleteGroupPrompt.modalProps}
                />
            )}
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
