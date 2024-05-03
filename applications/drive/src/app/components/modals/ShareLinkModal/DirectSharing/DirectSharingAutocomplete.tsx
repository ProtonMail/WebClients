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

import { ShareInvitee } from '../../../../store';
import MemberPermissionsSelect from './MemberPermissionsSelect';
import { getAddressInputItemAttributes } from './helpers/getAddressInputItemAttributes';
import { getGroupsWithContactsMap } from './helpers/getGroupsWithContactsMap';
import { inviteesToRecipients, recipientsToInvitees } from './helpers/transformers';

interface Props {
    invitees: ShareInvitee[];
    existingEmails: string[];
    hideFormActions: boolean;
    onAdd: (invitees: ShareInvitee[]) => void;
    onRemove: (email: string) => void;
    onSubmit: (invitees: ShareInvitee[], selectedPermissions: SHARE_MEMBER_PERMISSIONS) => void;
    onCancel: () => void;
    isAdding: boolean;
}
const DirectSharingAutocomplete = ({
    invitees,
    existingEmails,
    hideFormActions,
    onAdd,
    onRemove,
    onSubmit,
    onCancel,
    isAdding,
}: Props) => {
    const [selectedPermissions, setPermissions] = useState<SHARE_MEMBER_PERMISSIONS>(MEMBER_PERMISSIONS.VIEWER);
    const addressesInputText = c('Action').t`Add people or groups to share`;

    const [contactEmails] = useContactEmails();
    const [contactGroups] = useContactGroups();
    const groupsWithContactsMap = getGroupsWithContactsMap(contactEmails || [], contactGroups || []);

    const inputId = 'direct-sharing';
    const addressesAutocompleteRef = useRef<HTMLInputElement>(null);

    const count = invitees.length;

    // Here we check if the email address is already in invited members
    const isSubmitDisabled = !invitees.length || !!invitees.find((invitee) => invitee.isLoading || invitee.error);

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
                onRemove={() => onRemove(invitee.email)}
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
                            hasAddOnBlur
                            id={inputId}
                            compact
                            anchorRef={addressesAutocompleteRef}
                            contactEmails={contactEmails}
                            excludedEmails={existingEmails}
                            contactGroups={contactGroups}
                            groupsWithContactsMap={groupsWithContactsMap}
                            recipients={recipients}
                            onAddRecipients={(newRecipients) => onAdd(recipientsToInvitees(newRecipients))}
                            className="min-w-5 unstyled"
                            inputClassName={clsx([
                                (!count || hideFormActions) && 'my-0.5',
                                !!count && !hideFormActions && 'p-0 rounded-none',
                            ])}
                            placeholder={recipients.length && count ? '' : addressesInputText}
                        />
                    }
                    items={items}
                    className={clsx(['multi-select-container', !!count && 'px-2 py-0.5'])}
                >
                    <MemberPermissionsSelect
                        selectedPermissions={selectedPermissions}
                        onChange={handleSetPermissions}
                    />
                </InputField>
            </div>
            {!hideFormActions ? (
                <div className="flex justify-space-between ">
                    <Button onClick={onCancel}>{c('Action').t`Cancel`}</Button>
                    <Button
                        color="norm"
                        disabled={isSubmitDisabled}
                        loading={isAdding}
                        onClick={() => {
                            onSubmit(invitees, selectedPermissions);
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
