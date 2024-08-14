import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import {
    Dropdown,
    DropdownMenu,
    DropdownMenuButton,
    Icon,
    useModalStateObject,
    usePopperAnchor,
} from '@proton/components/components';
import useLoading from '@proton/hooks/useLoading';

import GroupItemActionPrompt from './GroupItemActionPrompt';

interface Props {
    handleDeleteGroup: () => Promise<void>;
    handleDeleteAllGroupMembers: () => Promise<void>;
    handleEnableGroupAddressE2EE: () => Promise<void>;
    handleDisableGroupAddressE2EE: () => Promise<void>;
    groupAddressE2EEEnabled: boolean | undefined;
}

const GroupItemMoreOptionsDropdown = ({
    handleDeleteGroup,
    handleDeleteAllGroupMembers,
    handleEnableGroupAddressE2EE,
    handleDisableGroupAddressE2EE,
    groupAddressE2EEEnabled,
}: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const deleteGroupPrompt = useModalStateObject();
    const removeAllMembersPrompt = useModalStateObject();
    const [loading, withLoading] = useLoading();

    // === false as in not true and not undefined
    const displayEnableE2EEButton = groupAddressE2EEEnabled === false;
    // === true as in true and not undefined
    const displayDisableE2EEButton = groupAddressE2EEEnabled === true;

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
                    {displayEnableE2EEButton && (
                        <DropdownMenuButton
                            className="text-left"
                            disabled={loading}
                            onClick={() => {
                                withLoading(handleEnableGroupAddressE2EE());
                            }}
                        >
                            {c('Action').t`Enable E2EE group mail encryption`}
                        </DropdownMenuButton>
                    )}
                    {displayDisableE2EEButton && (
                        <DropdownMenuButton
                            className="text-left"
                            disabled={loading}
                            onClick={() => {
                                withLoading(handleDisableGroupAddressE2EE());
                            }}
                        >
                            {c('Action').t`Disable E2EE group mail encryption`}
                        </DropdownMenuButton>
                    )}
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
