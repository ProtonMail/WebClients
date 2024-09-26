import { c } from 'ttag';

import { Button } from '@proton/atoms';
import InputFieldStacked from '@proton/components/components/inputFieldStacked/InputFieldStacked';
import InputFieldStackedGroup from '@proton/components/components/inputFieldStacked/InputFieldStackedGroup';
import AddressesAutocompleteTwo from '@proton/components/components/v2/addressesAutocomplete/AddressesAutocomplete';
import { useMembers } from '@proton/components/hooks';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import type { EnhancedMember, GroupMember, Recipient } from '@proton/shared/lib/interfaces';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

import type { NewGroupMember } from './EditGroup';

export const convertEnhancedMembersToContactEmails = (members: EnhancedMember[]): ContactEmail[] => {
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

export const convertGroupMemberToRecipient = (groupMembers: GroupMember[]): Recipient[] => {
    return groupMembers.map((member) => {
        return {
            Name: member.Email,
            Address: member.Email,
        };
    });
};

interface Props {
    newGroupMembers: NewGroupMember[];
    onAddNewGroupMembers: (members: NewGroupMember[]) => void;
    groupMembers: GroupMember[];
    onAddAllOrgMembers: () => void;
}

export const NewGroupMemberInput = ({
    newGroupMembers,
    onAddNewGroupMembers,
    groupMembers,
    onAddAllOrgMembers,
}: Props) => {
    const [members] = useMembers();
    const existingGroupMembers = convertGroupMemberToRecipient(groupMembers);
    const recipients = [...existingGroupMembers, ...newGroupMembers];

    const handleAddRecipients = (newRecipients: Recipient[]) => {
        onAddNewGroupMembers(newRecipients);
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
                        placeholder={c('Label').t`Add group member`}
                        hasAddOnBlur
                    />
                </InputFieldStacked>
            </InputFieldStackedGroup>
            <Button color="norm" shape="ghost" size="small" className="mt-2" onClick={onAddAllOrgMembers}>
                {c('Label').t`Add all organization members`}
            </Button>
        </>
    );
};
