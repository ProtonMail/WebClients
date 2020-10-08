import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useRouteMatch } from 'react-router-dom';
import { APPS, ALL_MEMBERS_ID, MEMBER_PRIVATE } from 'proton-shared/lib/constants';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { c } from 'ttag';
import { UserModel, Address, Organization, Member } from 'proton-shared/lib/interfaces';
import {
    Alert,
    Loader,
    Table,
    TableHeader,
    TableBody,
    TableRow,
    Block,
    Select,
    PrimaryButton,
    AppLink,
} from '../../components';
import { useMembers, useMemberAddresses, useModals, useOrganizationKey, useNotifications } from '../../hooks';

import AddressModal from './AddressModal';
import AddressStatus from './AddressStatus';
import { getStatus } from './helper';
import AddressActions from './AddressActions';
import AddressesWithUser from './AddressesWithUser';

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
        createModal(<AddressModal member={member} organizationKey={organizationKey} />);
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
            <Alert>{c('Info')
                .t`Premium plans let you add multiple email addresses to your account. All the emails associated with them will appear in the same mailbox. If you are the admin of a Professional or Visionary plan, you can manage email addresses for each user in your organization. The email address at the top of the list will automatically be selected as the default email address.`}</Alert>
            {!isOnlySelf && memberOptions.length > 2 ? (
                <Block>
                    <Select
                        id="memberSelect"
                        value={memberIndex}
                        options={memberOptions}
                        onChange={({ target: { value } }: ChangeEvent<HTMLSelectElement>) => setMemberIndex(+value)}
                    />
                </Block>
            ) : null}
            {!currentMember || memberIndex === ALL_MEMBERS_ID ? null : (
                <Block>
                    {mustActivateOrganizationKey ? (
                        <Alert type="warning">
                            {c('Warning')
                                .jt`You must ${activateLink} organization keys before adding an email address to a non-private member.`}
                        </Alert>
                    ) : (
                        <PrimaryButton onClick={() => handleAddAddress(currentMember)}>
                            {c('Action').t`Add address`}
                        </PrimaryButton>
                    )}
                </Block>
            )}
            {isSelfSelected ? (
                <AddressesWithUser user={user} />
            ) : (
                <Table className="pm-simple-table--has-actions">
                    <TableHeader
                        cells={[
                            c('Header for addresses table').t`Address`,
                            hasUsernameDisplay ? c('Header for addresses table').t`Username` : null,
                            c('Header for addresses table').t`Status`,
                            c('Header for addresses table').t`Actions`,
                        ].filter(Boolean)}
                    />
                    <TableBody
                        colSpan={hasUsernameDisplay ? 4 : 3}
                        loading={selectedMembers.some(({ ID }) => !Array.isArray(memberAddressesMap?.[ID]))}
                    >
                        {selectedMembers.flatMap((member) =>
                            (memberAddressesMap?.[member.ID] || []).map((address: Address, i: number) => (
                                <TableRow
                                    key={address.ID}
                                    cells={[
                                        <div className="ellipsis" title={address.Email}>
                                            {address.Email}
                                        </div>,
                                        hasUsernameDisplay && member.Name,
                                        <AddressStatus key={1} {...getStatus(address, i)} />,
                                        <AddressActions
                                            key={2}
                                            member={member}
                                            address={address}
                                            user={user}
                                            organizationKey={loadingOrganizationKey ? undefined : organizationKey}
                                        />,
                                    ].filter(isTruthy)}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            )}
        </>
    );
};

export default AddressesWithMembers;
