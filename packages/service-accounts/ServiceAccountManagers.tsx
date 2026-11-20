import { useState } from 'react';

import { c } from 'ttag';

import { useMembersRemote } from '@proton/account/members/useMembersRemote';
import { Avatar } from '@proton/atoms/Avatar/Avatar';
import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import AddressesAutocomplete from '@proton/components/components/v2/addressesAutocomplete/AddressesAutocomplete';
import { IcCross } from '@proton/icons/icons/IcCross';
import { emailValidator } from '@proton/shared/lib/helpers/formValidators';
import { getInitials } from '@proton/shared/lib/helpers/string';
import type { Recipient } from '@proton/shared/lib/interfaces/Address';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts/Contact';

import type { ServiceAccountManagerOption } from './helpers';

interface Props {
    selected: ServiceAccountManagerOption[];
    onChange: (managers: ServiceAccountManagerOption[]) => void;
    excludedMemberIDs: string[];
    canAssign: boolean;
    canRemove: boolean;
    disabled: boolean;
    existingMemberIDs: string[];
}

const ServiceAccountManagers = ({
    selected,
    onChange,
    excludedMemberIDs,
    canAssign,
    canRemove,
    disabled,
    existingMemberIDs,
}: Props) => {
    const [query, setQuery] = useState('');
    const trimmedQuery = query.trim();
    const search = useMembersRemote({ keywords: trimmedQuery, pageSize: 20 });
    const loading = !!trimmedQuery && search.loading;
    const error =
        trimmedQuery && search.error
            ? c('Error').t`Organization users could not be loaded. Please try again.`
            : undefined;
    const available = trimmedQuery
        ? search.data.flatMap(({ ID, Name, Addresses }) => {
              const Email = Addresses?.[0]?.Email;
              return ID && Email && !excludedMemberIDs.includes(ID) ? [{ MemberID: ID, Name, Email }] : [];
          })
        : [];
    const contactEmails: ContactEmail[] = available.map(({ MemberID, Email, Name }) => ({
        ID: MemberID,
        Email,
        Name,
        Type: [],
        Defaults: 0,
        Order: 0,
        ContactID: MemberID,
        LabelIDs: [],
        LastUsedTime: 0,
    }));
    const addRecipients = (recipients: Recipient[]) => {
        const selectedIDs = new Set(selected.map(({ MemberID }) => MemberID));
        const additions = recipients.flatMap(({ Address }) => {
            const member = available.find(({ Email }) => Email.toLowerCase() === Address.toLowerCase());
            if (!member || selectedIDs.has(member.MemberID)) {
                return [];
            }
            selectedIDs.add(member.MemberID);
            return [member];
        });
        onChange([...selected, ...additions]);
    };

    // The API refuses to remove the last manager of a service account that has managers: replace it instead.
    const keepLastManager = existingMemberIDs.length > 0 && selected.length === 1;

    return (
        <>
            {canAssign && (
                <AddressesAutocomplete
                    id="service-account-managers"
                    label={c('Label').t`Add managers`}
                    placeholder={c('Placeholder').t`Enter name or email address`}
                    recipients={selected.map(({ Name, Email }) => ({ Name, Address: Email }))}
                    contactEmails={contactEmails}
                    onAddRecipients={addRecipients}
                    onChange={setQuery}
                    validate={(email) =>
                        emailValidator(email) ||
                        (available.some(({ Email }) => Email.toLowerCase() === email.toLowerCase())
                            ? undefined
                            : c('Error').t`Select a user from your organization.`)
                    }
                    disabled={disabled}
                    suffix={loading && <CircleLoader size="small" />}
                    error={error}
                />
            )}
            {canAssign && !selected.length && (
                <p className="color-weak mt-2 mb-0">{c('Info')
                    .t`Add additional users from your organization to manage this service account.`}</p>
            )}
            {!!selected.length && (
                <ul className="unstyled mt-6 mb-0 flex flex-column gap-4">
                    {selected.map((manager) => {
                        const name = manager.Name || manager.Email || c('Label').t`Organization user`;
                        return (
                            <li key={manager.MemberID} className="flex items-center flex-nowrap gap-3">
                                <Avatar color="weak" className="shrink-0 w-7 h-7 text-sm">
                                    {getInitials(name)}
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="text-ellipsis">{name}</div>
                                    {manager.Email && (
                                        <div className="text-sm color-weak text-ellipsis">{manager.Email}</div>
                                    )}
                                </div>
                                {!keepLastManager && (canRemove || !existingMemberIDs.includes(manager.MemberID)) && (
                                    <Button
                                        icon
                                        shape="ghost"
                                        size="small"
                                        disabled={disabled}
                                        title={c('Action').t`Remove ${name}`}
                                        onClick={() =>
                                            onChange(selected.filter(({ MemberID }) => MemberID !== manager.MemberID))
                                        }
                                    >
                                        <IcCross alt={c('Action').t`Remove ${name}`} />
                                    </Button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </>
    );
};

export default ServiceAccountManagers;
