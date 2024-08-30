import { useMemo, useRef } from 'react';

import { c } from 'ttag';

import {
    AddressesAutocompleteTwo,
    AddressesInput,
    InputFieldTwo,
    useContactEmails,
    useContactGroups,
} from '@proton/components';
import type { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/constants';
import clsx from '@proton/utils/clsx';

import type { ShareInvitee } from '../../../../store';
import { DirectSharingAddressesInputItem } from './DirectSharingAddressesInputItem';
import { MemberDropdownMenu } from './MemberDropdownMenu';
import { getGroupsWithContactsMap } from './helpers/getGroupsWithContactsMap';
import { inviteesToRecipients, recipientsToInvitees } from './helpers/transformers';

interface Props {
    disabled: boolean;
    invitees: ShareInvitee[];
    existingEmails: string[];
    selectedPermissions: SHARE_MEMBER_PERMISSIONS;
    onAdd: (invitees: ShareInvitee[]) => void;
    onRemove: (email: string) => void;
    onChangePermissions: (permissions: SHARE_MEMBER_PERMISSIONS) => void;
}

export const DirectSharingAutocomplete = ({
    disabled,
    selectedPermissions,
    invitees,
    existingEmails,
    onAdd,
    onRemove,
    onChangePermissions,
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
                        document.getElementById(inputId)?.focus();
                    }}
                    assistContainerClassName="hidden"
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
                            inputClassName={clsx([!count && 'my-0.5', !!count && 'p-0 rounded-none'])}
                            placeholder={recipients.length && count ? '' : addressesInputText}
                            data-testid="address-input-field"
                        />
                    }
                    items={invitees.map((invitee) => (
                        <DirectSharingAddressesInputItem invitee={invitee} disabled={disabled} onRemove={onRemove} />
                    ))}
                    className={clsx(['multi-select-container', !!count && 'px-2 py-0.5'])}
                />
                <div className="absolute inset-y-center right-0">
                    <MemberDropdownMenu
                        disabled={disabled}
                        selectedPermissions={selectedPermissions}
                        onChangePermissions={onChangePermissions}
                        autocompleteOptions
                    />
                </div>
            </div>
        </>
    );
};
