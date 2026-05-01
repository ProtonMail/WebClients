import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import AddressesAutocompleteTwo from '@proton/components/components/v2/addressesAutocomplete/AddressesAutocomplete';
import useNotifications from '@proton/components/hooks/useNotifications';
import { RECIPIENT_TYPES } from '@proton/shared/lib/constants';
import { emailValidator } from '@proton/shared/lib/helpers/formValidators';
import { GROUP_MEMBER_TYPE, type GroupMember, type Recipient } from '@proton/shared/lib/interfaces';

import type { NewGroupMember } from './AddUsersToGroupModal';
import { convertGroupMemberToRecipient } from './helpers';
import useMemberContactEmailsRemote from './hooks/useMemberContactEmailsRemote';
import useGroupKeys from './useGroupKeys';

interface Props {
    newGroupMembers: NewGroupMember[];
    onAddNewGroupMembers: (members: NewGroupMember[]) => void;
    groupMembers: GroupMember[];
    onAddAllOrgMembers: () => void;
    groupId: string;
}

export const NewGroupMemberInput = ({
    newGroupMembers,
    onAddNewGroupMembers,
    groupMembers,
    onAddAllOrgMembers,
    groupId,
}: Props) => {
    const { getMemberPublicKeys } = useGroupKeys();
    const { createNotification } = useNotifications();
    const existingGroupMembers = convertGroupMemberToRecipient(groupMembers);
    const recipients = [...existingGroupMembers, ...newGroupMembers];
    const [processing, setProcessing] = useState(false);
    const [query, setQuery] = useState('');
    const [contactEmails, loading] = useMemberContactEmailsRemote(query, groupId);

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
                return GROUP_MEMBER_TYPE.EXTERNAL;
            }
        };

        try {
            const processedRecipients = await Promise.all(
                newRecipients.map(async (recipient): Promise<NewGroupMember> => {
                    const GroupMemberType = await getRecipientMemberType(recipient);
                    return { ...recipient, GroupMemberType };
                })
            );
            onAddNewGroupMembers(processedRecipients);
        } catch (error) {
            createNotification({ text: c('Error').t`Failed to add group member`, type: 'error' });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <>
            <AddressesAutocompleteTwo
                id="group-autocomplete"
                autoFocus
                label={c('Label').t`Invite people`}
                suffix={(processing || loading) && <CircleLoader size="small" />}
                recipients={recipients}
                onAddRecipients={handleAddRecipients}
                contactEmails={contactEmails}
                onChange={(value) => setQuery(value.trim())}
                validate={emailValidator}
                placeholder={c('Label').t`Enter name or email address`}
                hasAddOnBlur
                hasEmailPasting
                inputClassName="p-3"
            />
            <Button color="norm" shape="ghost" size="small" className="p-1 mt-1" onClick={onAddAllOrgMembers}>
                {c('Label').t`Add all organization members`}
            </Button>
        </>
    );
};
