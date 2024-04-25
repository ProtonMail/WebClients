import { useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import InputField from '@proton/components/components/v2/field/InputField';
import {
    AddressesAutocompleteTwo,
    AddressesInput,
    AddressesInputItem,
    useContactEmails,
    useContactGroups,
} from '@proton/components/index';
import { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/constants';
import { MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/permissions';
import clsx from '@proton/utils/clsx';

import { ShareInvitee, ShareMember } from '../../../../store';
import MemberPermissionsSelect from './MemberPermissionsSelect';
import { getAddressInputItemAttributes } from './helpers/getAddressInputItemAttributes';
import { getGroupsWithContactsMap } from './helpers/getGroupsWithContactsMap';
import { inviteesToRecipients, recipientsToInvitees } from './helpers/transformers';
import { useShareInvitees } from './useShareInvitees';

interface Props {
    onClose: () => void;
    onFocus: () => void;
    onSubmit: (invitees: ShareInvitee[]) => void;
    hidden: boolean;
    members: ShareMember[];
    addNewMembers: (invitees: ShareInvitee[], permissions: SHARE_MEMBER_PERMISSIONS) => Promise<void>;
    isAdding: boolean;
}
const DirectSharingAutocomplete = ({ onFocus, onClose, onSubmit, hidden, members, addNewMembers, isAdding }: Props) => {
    const [selectedPermissions, setPermissions] = useState<SHARE_MEMBER_PERMISSIONS>(MEMBER_PERMISSIONS.VIEWER);
    const addressesInputText = c('Action').t`Add people or groups to share`;

    const [contactEmails] = useContactEmails();
    const [contactGroups] = useContactGroups();
    const groupsWithContactsMap = getGroupsWithContactsMap(contactEmails || [], contactGroups || []);
    const existingEmails = [...members].map((member) => member.inviterEmail);
    const { invitees, count, add, remove, clean } = useShareInvitees(existingEmails);

    const inputId = 'direct-sharing';
    const addressesAutocompleteRef = useRef<HTMLInputElement>(null);

    // Here we check if the email address is already in invited members
    const isSubmitDisabled =
        !invitees.length ||
        !!invitees.find(
            (invitee) =>
                invitee.isLoading || invitee.error || members.some((member) => invitee.email === member.inviterEmail)
        );

    const items = invitees.map((invitee) => {
        const inputItemAttributes = getAddressInputItemAttributes(invitee);

        return (
            <AddressesInputItem
                key={invitee.email}
                labelTooltipTitle={inputItemAttributes?.labelTooltip}
                label={invitee.name}
                labelProps={{
                    className: 'py-1',
                }}
                icon={inputItemAttributes?.icon}
                iconTooltipTitle={inputItemAttributes?.iconTooltip}
                onClick={(event) => event.stopPropagation()}
                onRemove={() => remove(invitee.email)}
            />
        );
    });
    const recipients = useMemo(() => inviteesToRecipients(invitees), [invitees]);

    // This is needed because in other places where we use MemberPermissionsSelect we need to pass handler with return type Promise, to handle loading state
    const handleSetPermissions = async (value: SHARE_MEMBER_PERMISSIONS) => setPermissions(value);

    return (
        <>
            <div className="flex justify-space-between items-center mb-1">
                <InputField
                    as={AddressesInput}
                    ref={addressesAutocompleteRef}
                    id={inputId}
                    onClick={() => {
                        document.getElementById(inputId)?.focus();
                    }}
                    autocomplete={
                        <AddressesAutocompleteTwo
                            onKeyDown={() => onFocus()}
                            hasAddOnBlur
                            id={inputId}
                            compact
                            anchorRef={addressesAutocompleteRef}
                            contactEmails={contactEmails}
                            excludedEmails={existingEmails}
                            contactGroups={contactGroups}
                            groupsWithContactsMap={groupsWithContactsMap}
                            recipients={recipients}
                            onAddRecipients={(newRecipients) => add(recipientsToInvitees(newRecipients))}
                            className="min-w-5 unstyled"
                            inputClassName={clsx([
                                (!count || hidden) && 'my-0.5',
                                !!count && !hidden && 'p-0 rounded-none',
                            ])}
                            placeholder={recipients.length && !hidden ? '' : addressesInputText}
                        />
                    }
                    items={!hidden ? items : null}
                    className={clsx(['multi-select-container', !!count && 'px-2 py-0.5'])}
                >
                    <MemberPermissionsSelect
                        selectedPermissions={selectedPermissions}
                        onChange={handleSetPermissions}
                    />
                </InputField>
            </div>
            {!hidden ? (
                <div className="flex justify-space-between ">
                    <Button
                        onClick={() => {
                            clean();
                            onClose();
                        }}
                    >{c('Action').t`Cancel`}</Button>
                    <Button
                        color="norm"
                        disabled={isSubmitDisabled}
                        loading={isAdding}
                        onClick={async () => {
                            await addNewMembers(invitees, selectedPermissions);
                            clean();
                            onSubmit(invitees);
                        }}
                    >
                        {c('Action').t`Share`}
                    </Button>
                </div>
            ) : null}
        </>
    );
};

export default DirectSharingAutocomplete;
