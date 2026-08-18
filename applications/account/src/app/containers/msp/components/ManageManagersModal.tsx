import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { useMembers } from '@proton/account/members/hooks';
import { mspSubsidiariesActions } from '@proton/account/mspSubsidiaries';
import { getSubsidiaryManagersThunk, unassignMemberFromCompanyThunk } from '@proton/account/mspSubsidiaries/actions';
import { useMspSubsidiaries } from '@proton/account/mspSubsidiaries/hooks';
import { assignMemberToCompanyThunk } from '@proton/account/mspSubsidiaries/manageCompanyAction';
import { useMspDispatch } from '@proton/account/mspSubsidiaries/useMspDispatch';
import { Avatar } from '@proton/atoms/Avatar/Avatar';
import { Button } from '@proton/atoms/Button/Button';
import { ModalTwo, ModalTwoContent, ModalTwoHeader } from '@proton/components';
import Autocomplete from '@proton/components/components/autocomplete/Autocomplete';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { useErrorWrapper } from '@proton/components/hooks/useErrorHandler';
import { useLoadingByKey } from '@proton/hooks/useLoading';
import { IcCross } from '@proton/icons/icons/IcCross';
import { MEMBER_PRIVATE } from '@proton/shared/lib/constants';
import { getInitials } from '@proton/shared/lib/helpers/string';
import type { Member } from '@proton/shared/lib/interfaces';

import type { MspCompany } from '../types';

const getMemberLabel = (member: Member) => `${member.Name} ${member.Addresses?.[0]?.Email ?? ''}`;

interface ManagerRowProps {
    name: string;
    email?: string;
    loading?: boolean;
    onRemove: () => void;
}

const ManagerRow = ({ name, email, loading, onRemove }: ManagerRowProps) => (
    <div className="flex items-center gap-3 py-2">
        <Avatar className="shrink-0 text-rg text-semibold" color="weak">
            {getInitials(name || email || '')}
        </Avatar>
        <div className="flex flex-column flex-1 min-w-0">
            <span className="text-ellipsis" title={name}>
                {name}
            </span>
            {email && email !== name && (
                <span className="text-sm color-weak text-ellipsis" title={email}>
                    {email}
                </span>
            )}
        </div>
        <Button
            shape="ghost"
            size="small"
            icon
            loading={loading}
            disabled={loading}
            onClick={onRemove}
            title={c('Action').t`Remove manager`}
        >
            <IcCross size={4} alt={c('Action').t`Remove manager`} />
        </Button>
    </div>
);

interface Props {
    company: MspCompany;
    onClose: () => void;
}

// Delegated managers are added/removed immediately against the API — there's no save/cancel
// step in this modal, so nothing needs to be staged locally.
const ManageManagersModal = ({ company, onClose }: Props) => {
    const dispatch = useMspDispatch();
    const wrapError = useErrorWrapper();
    const [members = [], loadingMembers] = useMembers();

    // Read live from the store instead of copying into local state, so it can't drift from the cached companies list.
    const [subsidiaries] = useMspSubsidiaries();
    const managers = subsidiaries?.find((s) => s.ID === company.id)?.DelegatedManagers ?? [];
    const [pendingManagerIds, withManagerLoading] = useLoadingByKey();
    const [query, setQuery] = useState('');

    const addManager = (member: Member) =>
        withManagerLoading(
            member.ID,
            wrapError(async () => {
                const knownManagerIds = new Set(managers.map((manager) => manager.ID));
                await dispatch(assignMemberToCompanyThunk({ id: company.id, member }));
                // The assign call returns the member's parent-org ID, not the subsidiary-scoped ID managers
                // are keyed by elsewhere, so refetch and diff instead of guessing it. Merging only the new
                // record (rather than replacing the array) avoids clobbering a concurrent add/remove.
                const refreshedManagers = await dispatch(getSubsidiaryManagersThunk({ id: company.id }));
                const newManager = refreshedManagers.find((manager) => !knownManagerIds.has(manager.ID));
                if (newManager) {
                    dispatch(mspSubsidiariesActions.addDelegatedManager({ id: company.id, manager: newManager }));
                }
            })()
        );

    const removeManager = (managerId: string) =>
        withManagerLoading(
            managerId,
            wrapError(async () => {
                await dispatch(unassignMemberFromCompanyThunk({ id: company.id, memberId: managerId }));
                // Dispatched synchronously against the latest state, so concurrent removals can't race.
                dispatch(mspSubsidiariesActions.removeDelegatedManager({ id: company.id, managerId }));
            })()
        );

    // Managers are member rows in the subsidiary org, so their ID never matches the
    // corresponding member's ID in the parent org — match on PublicKey instead, which is
    // the same underlying user's key regardless of which org the member row belongs to.
    const managerPublicKeys = useMemo(() => new Set(managers.map((manager) => manager.PublicKey)), [managers]);

    const candidates = useMemo(
        () =>
            members.filter((member) => {
                // The caller is always the org owner in this modal, who already has full access to
                // every subsidiary regardless of delegated-manager records — excluding them avoids
                // offering a redundant, no-op assignment.
                if (member.Self || managerPublicKeys.has(member.PublicKey)) {
                    return false;
                }
                // Assigning a manager re-encrypts the org key to the member's own keys, so
                // candidates need to be non-private and have already set up their keys.
                return member.Private === MEMBER_PRIVATE.READABLE && !!member.Keys?.length;
            }),
        [members, managerPublicKeys]
    );

    const emailByPublicKey = useMemo(
        () => new Map(members.map((member) => [member.PublicKey, member.Addresses?.[0]?.Email])),
        [members]
    );

    const handleSelect = async (member: Member) => {
        setQuery('');
        await addManager(member);
    };

    const isAddingOrRemoving = Object.values(pendingManagerIds).some(Boolean);

    return (
        <ModalTwo open onClose={onClose}>
            <ModalTwoHeader title={c('Title').t`Manage managers`} subline={company.name} />
            <ModalTwoContent>
                <div className="flex flex-column gap-4 pb-6">
                    <p className="m-0 color-weak">
                        {getBoldFormattedText(
                            c('Info')
                                .t`Add additional users to **${company.name}** from your organization to manage this company.`
                        )}
                    </p>
                    <div className="flex flex-column gap-2">
                        <label className="text-semibold" htmlFor="msp-add-manager">{c('Label').t`Add managers`}</label>
                        <Autocomplete
                            id="msp-add-manager"
                            value={query}
                            onChange={setQuery}
                            onSelect={handleSelect}
                            options={candidates}
                            getData={getMemberLabel}
                            placeholder={c('Placeholder').t`Enter name or email address`}
                            disabled={isAddingOrRemoving || loadingMembers}
                        />
                    </div>
                    <div className="flex flex-column">
                        {managers.map((manager) => (
                            <ManagerRow
                                key={manager.ID}
                                name={manager.Name}
                                email={emailByPublicKey.get(manager.PublicKey)}
                                loading={pendingManagerIds[manager.ID]}
                                onRemove={() => removeManager(manager.ID)}
                            />
                        ))}
                    </div>
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default ManageManagersModal;
