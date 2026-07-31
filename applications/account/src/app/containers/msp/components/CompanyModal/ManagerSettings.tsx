import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { useMembers } from '@proton/account/members/hooks';
import { Loader } from '@proton/components';
import Autocomplete from '@proton/components/components/autocomplete/Autocomplete';
import { MEMBER_PRIVATE } from '@proton/shared/lib/constants';
import type { Member } from '@proton/shared/lib/interfaces';

import ManagerRow from './ManagerRow';
import { useCompanyModalContext } from './context';

const getMemberLabel = (member: Member) => `${member.Name} ${member.Addresses?.[0]?.Email ?? ''}`;

const ManagerSettings = () => {
    const [members = [], loadingMembers] = useMembers();
    const { managers, managersLoading, pendingManagerIds, addManager, removeManager } = useCompanyModalContext();
    const [query, setQuery] = useState('');

    // Managers are member rows in the subsidiary org, so their ID never matches the
    // corresponding member's ID in the parent org — match on PublicKey instead, which is
    // the same underlying user's key regardless of which org the member row belongs to.
    const managerPublicKeys = useMemo(() => new Set(managers.map((manager) => manager.PublicKey)), [managers]);

    const candidates = useMemo(
        () =>
            members.filter((member) => {
                if (managerPublicKeys.has(member.PublicKey)) {
                    return false;
                }
                // Assigning a manager re-encrypts the org key to the member's own keys, so
                // non-self members need to be non-private and have already set up their keys.
                return member.Self || (member.Private === MEMBER_PRIVATE.READABLE && !!member.Keys?.length);
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

    return (
        <div className="flex flex-column gap-4">
            <p className="m-0 color-weak">{c('Info')
                .t`Add additional users from your organization to manage this company.`}</p>
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
                    disabled={pendingManagerIds.size > 0 || loadingMembers}
                />
            </div>
            {managersLoading ? (
                <Loader />
            ) : (
                <div className="flex flex-column">
                    {managers.map((manager) => (
                        <ManagerRow
                            key={manager.ID}
                            name={manager.Name}
                            email={emailByPublicKey.get(manager.PublicKey)}
                            loading={pendingManagerIds.has(manager.ID)}
                            onRemove={() => removeManager(manager.ID)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManagerSettings;
