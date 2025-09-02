import { useMemo, useRef } from 'react';

import { c } from 'ttag';

import { AddressesAutocompleteTwo, AddressesInput, InputFieldTwo } from '@proton/components';
import type { MemberRole } from '@proton/drive/index';
import { useContactGroups } from '@proton/mail';
import { useContactEmails } from '@proton/mail/store/contactEmails/hooks';
import clsx from '@proton/utils/clsx';

import { RoleDropdownMenu } from '../RoleDropdownMenu';
import { DirectSharingAddressesInputItem } from './DirectSharingAddressesInputItem';
import { getGroupsWithContactsMap } from './helpers/getGroupsWithContactsMap';
import { inviteesToRecipients, recipientsToInvitees } from './helpers/transformers';
import type { ShareInvitee } from './interfaces';

interface Props {
    disabled: boolean;
    invitees: ShareInvitee[];
    existingEmails: string[];
    selectedRole: MemberRole;
    onAdd: (invitees: ShareInvitee[]) => void;
    onRemove: (email: string) => void;
    onChangeRole: (role: MemberRole) => void;
}

export const DirectSharingAutocomplete = ({
    disabled,
    selectedRole,
    invitees,
    existingEmails,
    onAdd,
    onRemove,
    onChangeRole,
}: Props) => {
    const addressesInputText = c('Action').t`Add people or groups to share`;

    const [contactEmails] = useContactEmails();
    const [contactGroups] = useContactGroups();
    const groupsWithContactsMap = getGroupsWithContactsMap(contactEmails || [], contactGroups || []);

    const inputId = 'direct-sharing-autocomplete';
    const addressesAutocompleteRef = useRef<HTMLInputElement>(null);

    const count = invitees.length;

    const recipients = useMemo(() => inviteesToRecipients(invitees), [invitees]);

    return (
        <>
            <div className="flex justify-space-between items-center flex-nowrap mt-3 mb-6 relative">
                <InputFieldTwo
                    as={AddressesInput}
                    autocompleteContainerProps={{
                        className: 'max-w-custom max-h-custom overflow-auto',
                        style: { '--max-w-custom': 'calc(100% - 4.25rem)', '--max-h-custom': '7.75rem' },
                    }}
                    ref={addressesAutocompleteRef}
                    id={inputId}
                    disabled={disabled}
                    onClick={() => {
                        addressesAutocompleteRef.current?.focus();
                    }}
                    assistContainerClassName="sr-only"
                    autocomplete={
                        <AddressesAutocompleteTwo
                            hasAddOnBlur
                            id={inputId}
                            compact
                            disabled={disabled}
                            anchorRef={addressesAutocompleteRef}
                            contactEmails={contactEmails}
                            excludedEmails={existingEmails}
                            contactGroups={contactGroups}
                            groupsWithContactsMap={groupsWithContactsMap}
                            recipients={recipients}
                            onAddRecipients={(newRecipients) => onAdd(recipientsToInvitees(newRecipients))}
                            className="min-w-5 unstyled"
                            inputClassName={clsx([
                                'outline-none--at-all',
                                !count && 'my-0.5',
                                !!count && 'p-0 rounded-none',
                            ])}
                            placeholder={recipients.length && count ? '' : addressesInputText}
                            data-testid="address-input-field"
                        />
                    }
                    items={invitees.map((invitee) => (
                        <DirectSharingAddressesInputItem
                            key={`${invitee.contactId}-${invitee.email}`}
                            invitee={invitee}
                            disabled={disabled}
                            onRemove={onRemove}
                        />
                    ))}
                    className={clsx(['multi-select-container', !!count && 'px-2 py-0.5'])}
                />
                <div className="absolute inset-y-center right-0">
                    <RoleDropdownMenu
                        disabled={disabled}
                        selectedRole={selectedRole}
                        onChangeRole={onChangeRole}
                        autocompleteOptions
                    />
                </div>
            </div>
        </>
    );
};
