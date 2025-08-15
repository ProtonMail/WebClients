import { c } from 'ttag';

import { useMembers } from '@proton/account/members/hooks';
import { Button } from '@proton/atoms';
import InputFieldStacked from '@proton/components/components/inputFieldStacked/InputFieldStacked';
import InputFieldStackedGroup from '@proton/components/components/inputFieldStacked/InputFieldStackedGroup';
import AddressesAutocompleteTwo from '@proton/components/components/v2/addressesAutocomplete/AddressesAutocomplete';
import { RECIPIENT_TYPES } from '@proton/shared/lib/constants';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import {
    type ApiKeysConfig,
    type EnhancedMember,
    GROUP_MEMBER_TYPE,
    type GroupMember,
    type Recipient,
} from '@proton/shared/lib/interfaces';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

import type { NewGroupMember } from './EditGroup';
import useGroupKeys from './useGroupKeys';

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

export const convertGroupMemberToRecipient = (groupMembers: GroupMember[] | ContactEmail[]): Recipient[] => {
    return groupMembers.map((member) => {
        return {
            Name: member.Email || '',
            Address: member.Email || '',
        };
    });
};

interface Props {
    newGroupMembers: NewGroupMember[];
    onAddNewGroupMembers: (members: NewGroupMember[]) => void;
    groupMembers: GroupMember[];
    onAddAllOrgMembers: () => void;
}

const getEmailProperties = async (
    email: string,
    getMemberPublicKeys: (email: string) => Promise<ApiKeysConfig>
): Promise<{ isExternal: boolean; hasKeys: boolean }> => {
    const forwardeeKeysConfig = await getMemberPublicKeys(email);
    const isExternal = forwardeeKeysConfig.RecipientType === RECIPIENT_TYPES.TYPE_EXTERNAL;
    const hasKeys = (forwardeeKeysConfig as any).Address.Keys.length > 0;

    return { isExternal, hasKeys };
};

export const NewGroupMemberInput = ({
    newGroupMembers,
    onAddNewGroupMembers,
    groupMembers,
    onAddAllOrgMembers,
}: Props) => {
    const { getMemberPublicKeys } = useGroupKeys();

    const [members] = useMembers();
    const existingGroupMembers = convertGroupMemberToRecipient(groupMembers);
    const recipients = [...existingGroupMembers, ...newGroupMembers];

    const handleAddRecipients = async (newRecipients: Recipient[]) => {
        const recipients = [];
        for (const newRecipient of newRecipients) {
            const { isExternal, hasKeys } = await getEmailProperties(newRecipient.Address, getMemberPublicKeys);

            let GroupMemberType = GROUP_MEMBER_TYPE.INTERNAL;
            if (isExternal) {
                GroupMemberType = hasKeys ? GROUP_MEMBER_TYPE.INTERNAL_TYPE_EXTERNAL : GROUP_MEMBER_TYPE.EXTERNAL;
            }

            recipients.push({ ...newRecipient, GroupMemberType });
        }
        onAddNewGroupMembers(recipients);
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
            <Button color="norm" shape="ghost" size="small" className="p-1 mt-1" onClick={onAddAllOrgMembers}>
                {c('Label').t`Add all organization members`}
            </Button>
        </>
    );
};
