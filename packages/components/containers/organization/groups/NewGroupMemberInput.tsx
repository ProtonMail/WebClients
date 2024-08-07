import { c } from 'ttag';

import { AddressesAutocompleteTwo } from '@proton/components/components';
import { InputFieldStacked } from '@proton/components/components/inputFieldStacked';
import InputFieldStackedGroup from '@proton/components/components/inputFieldStacked/InputFieldStackedGroup';
import { useMembers } from '@proton/components/hooks';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import type { EnhancedMember, GroupMember } from '@proton/shared/lib/interfaces';
import type { Recipient } from '@proton/shared/lib/interfaces';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

import type { NewGroupMember } from './EditGroup';

const convertEnhancedMembersToContactEmails = (members: EnhancedMember[]): ContactEmail[] => {
    return members.flatMap(
        (member) =>
            member.Addresses?.map((address) => ({
                ID: address.ID,
                Email: address.Email,
                Name: member.Name,
                Type: [],
                Defaults: 0,
                Order: 0,
                ContactID: member.ID,
                LabelIDs: [],
                LastUsedTime: 0,
            })) || []
    );
};

const convertGroupMemberToRecipient = (groupMembers: GroupMember[]): Recipient[] => {
    return groupMembers.map((member) => {
        return {
            Name: member.Email,
            Address: member.Email,
        };
    });
};

interface Props {
    newGroupMembers: NewGroupMember[];
    handleAddNewGroupMembers: (members: NewGroupMember[]) => void;
    groupMembers: GroupMember[];
}

export const NewGroupMemberInput = ({ newGroupMembers, handleAddNewGroupMembers, groupMembers }: Props) => {
    const [members] = useMembers();
    const existingGroupMembers = convertGroupMemberToRecipient(groupMembers);
    const recipients = [...existingGroupMembers, ...newGroupMembers];

    const handleAddRecipients = (newRecipients: Recipient[]) => {
        handleAddNewGroupMembers(newRecipients);
    };

    return (
        <>
            <InputFieldStackedGroup classname="mt-4">
                <InputFieldStacked isGroupElement icon="pass-group">
                    <AddressesAutocompleteTwo
                        id="group-autocomplete"
                        recipients={recipients}
                        onAddRecipients={handleAddRecipients}
                        contactEmails={members && convertEnhancedMembersToContactEmails(members)}
                        label={c('Label').t`Group members`}
                        validate={(email: string) => {
                            if (!validateEmailAddress(email)) {
                                return c('Input Error').t`Not a valid email address`;
                            }
                        }}
                        unstyled
                    />
                </InputFieldStacked>
            </InputFieldStackedGroup>
        </>
    );
};
