import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useRouteMatch } from 'react-router-dom';
import { APPS, ALL_MEMBERS_ID, MEMBER_PRIVATE } from 'proton-shared/lib/constants';
import { c } from 'ttag';
import { UserModel, Organization, Member } from 'proton-shared/lib/interfaces';

import { Alert, Loader, Select, Button, AppLink } from '../../components';
import { useMembers, useMemberAddresses, useModals, useOrganizationKey, useNotifications } from '../../hooks';

import { SettingsParagraph } from '../account';

import AddressModal from './AddressModal';
import AddressesWithUser from './AddressesWithUser';
import AddressesTable from './AddressesTable';

const getMemberIndex = (members: Member[] = [], memberID?: string, isOnlySelf?: boolean) => {
    const newMemberIndex =
        memberID && !isOnlySelf
            ? members.findIndex(({ ID }) => ID === memberID)
            : members.findIndex(({ Self }) => Self);
    if (newMemberIndex === -1 && members.length) {
        return 0;
    }
    return newMemberIndex;
};

interface Props {
    user: UserModel;
    organization: Organization;
    isOnlySelf?: boolean;
}

const AddressesWithMembers = ({ user, organization, isOnlySelf }: Props) => {
    const match = useRouteMatch<{ memberID?: string }>();
    const { createModal } = useModals();
    const [members, loadingMembers] = useMembers();
    const [memberAddressesMap, loadingMemberAddresses] = useMemberAddresses(members);
    const [memberIndex, setMemberIndex] = useState(-1);
    const [organizationKey, loadingOrganizationKey] = useOrganizationKey(organization);
    const { createNotification } = useNotifications();

    useEffect(() => {
        if (memberIndex === -1 && Array.isArray(members)) {
            setMemberIndex(getMemberIndex(members, match.params.memberID, isOnlySelf));
        }
    }, [members]);

    useEffect(() => {
        if (memberIndex !== -1 && Array.isArray(members)) {
            setMemberIndex(getMemberIndex(members, match.params.memberID, isOnlySelf));
        }
    }, [match.params.memberID]);

    const selectedMembers = useMemo(() => {
        if (memberIndex === ALL_MEMBERS_ID) {
            return members;
        }
        if (members && memberIndex in members) {
            return [members[memberIndex]];
        }
        return [];
    }, [members, memberIndex]);

    const hasUsernameDisplay = memberIndex === ALL_MEMBERS_ID;
    const isSelfSelected = useMemo(() => {
        if (!members) {
            return false;
        }
        return memberIndex === members.findIndex(({ Self }) => Self);
    }, [memberIndex, members]);

    if (loadingMembers || memberIndex === -1 || (loadingMemberAddresses && !memberAddressesMap)) {
        return <Loader />;
    }

    const handleAddAddress = (member: Member) => {
        if (member.Private === MEMBER_PRIVATE.READABLE && !organizationKey?.privateKey) {
            createNotification({ type: 'error', text: c('Error').t`The organization key must be activated first.` });
            throw new Error('Organization key is not decrypted');
        }
        createModal(<AddressModal member={member} members={members} organizationKey={organizationKey} />);
    };

    const memberOptions = [
        {
            text: c('Option').t`All users`,
            value: ALL_MEMBERS_ID,
        },
        ...(members || []).map(({ Name }, i) => ({
            text: Name,
            value: i,
        })),
    ];

    const currentMember = Array.isArray(members) && memberIndex !== -1 ? members[memberIndex] : undefined;

    const mustActivateOrganizationKey =
        currentMember?.Private === MEMBER_PRIVATE.READABLE && !organizationKey?.privateKey;

    const activateLink = (
        <AppLink to="/organization#password" toApp={APPS.PROTONACCOUNT} target="_self">{c('Action')
            .t`activate`}</AppLink>
    );

    return (
        <>
            <SettingsParagraph>
                {c('Info')
                    .t`The email address you place at the top of the list is your default email address. Drag and drop to reorder your addresses.`}
            </SettingsParagraph>

            {!isOnlySelf && memberOptions.length > 2 ? (
                <div className="mb1">
                    <Select
                        id="memberSelect"
                        value={memberIndex}
                        options={memberOptions}
                        onChange={({ target: { value } }: ChangeEvent<HTMLSelectElement>) => setMemberIndex(+value)}
                    />
                </div>
            ) : null}

            {!currentMember || memberIndex === ALL_MEMBERS_ID ? null : (
                <div className="mb1">
                    {mustActivateOrganizationKey ? (
                        <Alert type="warning">
                            {c('Warning')
                                .jt`You must ${activateLink} organization keys before adding an email address to a non-private member.`}
                        </Alert>
                    ) : (
                        <Button shape="outline" onClick={() => handleAddAddress(currentMember)}>
                            {c('Action').t`Add address`}
                        </Button>
                    )}
                </div>
            )}

            {isSelfSelected ? (
                <AddressesWithUser user={user} member={currentMember} organizationKey={organizationKey} />
            ) : (
                <AddressesTable
                    hasUsername={hasUsernameDisplay}
                    loading={selectedMembers.some(({ ID }) => !Array.isArray(memberAddressesMap?.[ID]))}
                    user={user}
                    members={selectedMembers}
                    memberAddresses={memberAddressesMap}
                    organizationKey={loadingOrganizationKey ? undefined : organizationKey}
                />
            )}
        </>
    );
};

export default AddressesWithMembers;
