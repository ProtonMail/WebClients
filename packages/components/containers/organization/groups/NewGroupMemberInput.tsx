import { useState } from 'react';

import { c } from 'ttag';

import { useMembers } from '@proton/account/members/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import InputFieldStacked from '@proton/components/components/inputFieldStacked/InputFieldStacked';
import InputFieldStackedGroup from '@proton/components/components/inputFieldStacked/InputFieldStackedGroup';
import AddressesAutocompleteTwo from '@proton/components/components/v2/addressesAutocomplete/AddressesAutocomplete';
import useNotifications from '@proton/components/hooks/useNotifications';
import { RECIPIENT_TYPES } from '@proton/shared/lib/constants';
import { emailValidator } from '@proton/shared/lib/helpers/formValidators';
import { GROUP_MEMBER_TYPE, type GroupMember, type Recipient } from '@proton/shared/lib/interfaces';

import type { NewGroupMember } from './EditGroup';
import { convertEnhancedMembersToContactEmails, convertGroupMemberToRecipient } from './helpers';
import useGroupKeys from './useGroupKeys';

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
    const { getMemberPublicKeys } = useGroupKeys();
    const { createNotification } = useNotifications();

    const [members] = useMembers();
    const existingGroupMembers = convertGroupMemberToRecipient(groupMembers);
    const recipients = [...existingGroupMembers, ...newGroupMembers];
    const [processing, setProcessing] = useState(false);

    const handleAddRecipients = async (newRecipients: Recipient[]) => {
        setProcessing(true);
        const getRecipientMemberType = async (recipient: Recipient): Promise<GROUP_MEMBER_TYPE> => {
            try {
                const forwardeeKeysConfig = await getMemberPublicKeys(recipient.Address);
                const isExternal = forwardeeKeysConfig.RecipientType === RECIPIENT_TYPES.TYPE_EXTERNAL;
                const hasKeys = (forwardeeKeysConfig as any).Address.Keys.length > 0;
                if (isExternal) {
                    return hasKeys ? GROUP_MEMBER_TYPE.INTERNAL_TYPE_EXTERNAL : GROUP_MEMBER_TYPE.EXTERNAL;
                }
                return GROUP_MEMBER_TYPE.INTERNAL;
            } catch (error) {
                // If we fail to get the member public keys, default to external type
                return GROUP_MEMBER_TYPE.EXTERNAL;
            }
        };

        const processRecipient = async (recipient: Recipient): Promise<NewGroupMember> => {
            const GroupMemberType = await getRecipientMemberType(recipient);
            const existingMember = members?.find((member) =>
                member.Addresses?.some((address) => address.Email === recipient.Address)
            );
            const userName = existingMember?.Name ?? recipient.Name;
            return { ...recipient, GroupMemberType, Name: userName };
        };

        try {
            const processedRecipients = await Promise.all(newRecipients.map(processRecipient));
            onAddNewGroupMembers(processedRecipients);
        } catch (error) {
            createNotification({ text: c('Error').t`Failed to add group member`, type: 'error' });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <>
            <InputFieldStackedGroup classname="mt-4">
                <InputFieldStacked
                    isGroupElement
                    icon="pass-group"
                    suffix={processing && <CircleLoader size="small" />}
                >
                    <AddressesAutocompleteTwo
                        id="group-autocomplete"
                        recipients={recipients}
                        onAddRecipients={handleAddRecipients}
                        contactEmails={convertEnhancedMembersToContactEmails(members)}
                        label={c('Label').t`Group members`}
                        validate={emailValidator}
                        unstyled
                        placeholder={c('Label').t`Add group member`}
                        hasAddOnBlur
                        hasEmailPasting
                    />
                </InputFieldStacked>
            </InputFieldStackedGroup>
            <Button color="norm" shape="ghost" size="small" className="p-1 mt-1" onClick={onAddAllOrgMembers}>
                {c('Label').t`Add all organization members`}
            </Button>
        </>
    );
};
