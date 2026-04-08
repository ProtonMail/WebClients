import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import useNotifications from '@proton/components/hooks/useNotifications';
import { ADDRESS_TYPE } from '@proton/shared/lib/constants';
import type { EnhancedMember, Group, GroupMember } from '@proton/shared/lib/interfaces';
import { GROUP_MEMBER_TYPE } from '@proton/shared/lib/interfaces';

import { NewGroupMemberInput } from './NewGroupMemberInput';
import { NewGroupMemberItem } from './NewGroupMemberItem';
import WillDisableE2eePrompt from './WillDisableE2eePrompt';
import type { GroupsManagementReturn } from './types';

export interface NewGroupMember {
    Name: string;
    Address: string;
    GroupMemberType: GROUP_MEMBER_TYPE;
}

const getEmailIsExternalMap = (members: EnhancedMember[]): Record<string, boolean> => {
    return members.reduce<Record<string, boolean>>((acc, member) => {
        (member?.Addresses ?? []).forEach((address) => {
            acc[address.Email] = address.Type === ADDRESS_TYPE.TYPE_EXTERNAL;
        });
        return acc;
    }, {});
};

interface Props {
    modalProps: ModalStateProps;
    group: Group;
    groupMembers: GroupMember[];
    members: EnhancedMember[];
    isE2eeEnabled: boolean;
    showMailFeatures: boolean;
    addressEmailToMemberMap: GroupsManagementReturn['addressEmailToMemberMap'];
    onAddMembers: (group: Group, emails: string[]) => void;
}

const AddUsersToGroupModal = ({
    modalProps,
    group,
    groupMembers,
    members,
    isE2eeEnabled,
    showMailFeatures,
    addressEmailToMemberMap,
    onAddMembers,
}: Props) => {
    const { createNotification } = useNotifications();
    const [newGroupMembers, setNewGroupMembers] = useState<NewGroupMember[]>([]);
    const [e2eeWillBeDisabled, setE2eeWillBeDisabled] = useState(!isE2eeEnabled);
    const [willDisableE2eeModalProps, setWillDisableE2eeModal, renderWillDisableE2eeModal] = useModalState();

    const sortedNewGroupMembers = [...newGroupMembers].reverse();
    const emailIsExternalMap = getEmailIsExternalMap(members);

    const filterOutListedMembers = (newMembers: NewGroupMember[]) => {
        const exisitingEmails = new Set([
            ...groupMembers?.map((member) => member?.Email),
            ...newGroupMembers.map((newMember) => newMember.Address),
        ]);
        const newMembersToAdd = newMembers.filter((member) => !exisitingEmails.has(member.Address));
        if (newMembersToAdd.length === 0) {
            createNotification({ text: c('Info').t`All members have been added.` });
            return [];
        }
        return newMembersToAdd;
    };

    const filterOutKeylessPrivateMembers = (newMembers: NewGroupMember[]) => {
        const filteredOutNames: string[] = [];

        const result = newMembers.filter((newMember) => {
            const existingMember = addressEmailToMemberMap[newMember.Address];

            if (existingMember && existingMember.Private && existingMember.PublicKey === null) {
                filteredOutNames.push(existingMember.Name);
                return false;
            }

            return true;
        });

        if (filteredOutNames.length > 0) {
            const displayedNames =
                filteredOutNames.slice(0, 3).join(', ') + (filteredOutNames.length > 3 ? ', ...' : '');

            createNotification({
                text: c('Error')
                    .t`Private users can be added to group once they've signed in for the first time: ${displayedNames}`,
                type: 'error',
            });
        }

        return result;
    };

    const handleAddNewMembers = async (newMembers: NewGroupMember[]) => {
        let newMembersToAdd = filterOutKeylessPrivateMembers(newMembers);

        // Early return prevents showing contradicting notifications
        if (newMembersToAdd.length === 0) {
            return;
        }

        const willDisableE2ee = newMembersToAdd.some((member) => member.GroupMemberType !== GROUP_MEMBER_TYPE.INTERNAL);
        if (showMailFeatures && willDisableE2ee && !e2eeWillBeDisabled) {
            setWillDisableE2eeModal(true);
        }
        newMembersToAdd = filterOutListedMembers(newMembersToAdd);

        setNewGroupMembers((prev) => [...prev, ...newMembersToAdd]);
    };

    const handleRemoveNewGroupMember = (memberToRemove: NewGroupMember) => {
        const updatedNewMembersList = newGroupMembers.filter((prev) => prev !== memberToRemove);
        setNewGroupMembers(updatedNewMembersList);
    };

    const handleAddAllOrganizationMembers = async () => {
        const orgMembers = Object.keys(addressEmailToMemberMap).map((email) => {
            const isExternal = emailIsExternalMap[email];
            const hasKeys = !!addressEmailToMemberMap[email];

            let GroupMemberType = GROUP_MEMBER_TYPE.INTERNAL;
            if (isExternal) {
                GroupMemberType = hasKeys ? GROUP_MEMBER_TYPE.INTERNAL_TYPE_EXTERNAL : GROUP_MEMBER_TYPE.EXTERNAL;
            }

            return {
                Name: email,
                Address: email,
                GroupMemberType,
            };
        });
        const newMembersToAdd = filterOutKeylessPrivateMembers(filterOutListedMembers(orgMembers));

        const willDisableE2ee = newMembersToAdd.some((member) => member.GroupMemberType !== GROUP_MEMBER_TYPE.INTERNAL);
        if (showMailFeatures && willDisableE2ee && !e2eeWillBeDisabled) {
            setWillDisableE2eeModal(true);
        }
        setNewGroupMembers((prev) => [...prev, ...newMembersToAdd]);
    };

    const handleWillDisableE2ee = () => {
        setE2eeWillBeDisabled(true);
        setWillDisableE2eeModal(false);
    };

    const handleWillNotDisableE2ee = () => {
        setWillDisableE2eeModal(false);
        setNewGroupMembers((prev) => prev.filter((member) => member.GroupMemberType === GROUP_MEMBER_TYPE.INTERNAL));
    };

    const handleConfirm = () => {
        const emails = newGroupMembers.map((member) => member.Address);
        onAddMembers(group, emails);
        setNewGroupMembers([]);
        modalProps.onClose();
    };

    return (
        <>
            <ModalTwo {...modalProps} size="medium">
                <ModalTwoHeader title={c('Title').t`Add users`} />
                <ModalTwoContent>
                    <p className="mt-0 mb-4 color-weak">{c('Info').t`Add users by name or email to this group.`}</p>
                    <NewGroupMemberInput
                        newGroupMembers={newGroupMembers}
                        onAddNewGroupMembers={handleAddNewMembers}
                        groupMembers={groupMembers}
                        onAddAllOrgMembers={handleAddAllOrganizationMembers}
                    />
                    <div
                        className="mt-8 flex flex-column flex-nowrap gap-3 overflow-y-auto overflow-x-hidden h-custom"
                        style={{ '--h-custom': '17rem' }}
                    >
                        {sortedNewGroupMembers.map((member) => (
                            <NewGroupMemberItem
                                key={member.Address}
                                member={member}
                                handleRemoveNewMember={handleRemoveNewGroupMember}
                                submitting={false}
                                showMailFeatures={showMailFeatures}
                            />
                        ))}
                    </div>
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button color="weak" onClick={modalProps.onClose}>
                        {c('Action').t`Cancel`}
                    </Button>
                    <Button color="norm" disabled={newGroupMembers.length === 0} onClick={handleConfirm}>
                        {c('Action').t`Add`}
                    </Button>
                </ModalTwoFooter>
            </ModalTwo>
            {renderWillDisableE2eeModal && (
                <WillDisableE2eePrompt
                    onConfirm={handleWillDisableE2ee}
                    onCancel={handleWillNotDisableE2ee}
                    {...willDisableE2eeModalProps}
                />
            )}
        </>
    );
};

export default AddUsersToGroupModal;
