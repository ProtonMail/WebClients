import React, { useEffect, useMemo, useState } from 'react';
import { withRouter } from 'react-router';
import { RouteComponentProps } from 'react-router-dom';
import { ALL_MEMBERS_ID, MEMBER_PRIVATE } from 'proton-shared/lib/constants';
import { c } from 'ttag';
import { UserModel, Address, Organization, Member } from 'proton-shared/lib/interfaces';
import { Alert, Loader, Table, TableHeader, TableBody, TableRow } from '../../components';
import { useMembers, useMemberAddresses, useModals, useOrganizationKey } from '../../hooks';

import AddressModal from './AddressModal';
import AddressesToolbar from './AddressesToolbar';
import AddressStatus from './AddressStatus';
import { getStatus } from './helper';
import AddressActions from './AddressActions';
import AddressesWithUser from './AddressesWithUser';

interface Props extends RouteComponentProps<{ memberID: string }> {
    user: UserModel;
    organization: Organization;
}
const AddressesWithMembers = ({ match, user, organization }: Props) => {
    const { createModal } = useModals();
    const [members, loadingMembers] = useMembers();
    const [memberAddressesMap, loadingMemberAddresses] = useMemberAddresses(members);
    const [memberIndex, setMemberIndex] = useState(-1);
    const [organizationKey, loadingOrganizationKey] = useOrganizationKey(organization);

    useEffect(() => {
        if (memberIndex === -1 && Array.isArray(members)) {
            if (match.params.memberID) {
                setMemberIndex(members.findIndex(({ ID }) => ID === match.params.memberID));
            } else {
                setMemberIndex(members.findIndex(({ Self }) => Self));
            }
        }
    }, [members]);

    const selectedMembers = useMemo(() => {
        if (memberIndex === ALL_MEMBERS_ID) {
            return members;
        }
        if (members && memberIndex in members) {
            return [members[memberIndex]];
        }
        return [];
    }, [members, memberIndex]);

    if (loadingMembers || memberIndex === -1 || (loadingMemberAddresses && !memberAddressesMap)) {
        return (
            <>
                <Loader />
            </>
        );
    }

    const handleAddAddress = (member: Member) => {
        if (member.Private === MEMBER_PRIVATE.READABLE && !organizationKey?.privateKey) {
            throw new Error('Organization key is not decrypted');
        }
        createModal(<AddressModal member={member} organizationKey={organizationKey} />);
    };

    const showUsername = memberIndex === ALL_MEMBERS_ID;
    const selectedSelf = memberIndex === members.findIndex(({ Self }) => Self);

    return (
        <>
            <Alert>{c('Info')
                .t`Premium plans let you add multiple email addresses to your account. All the emails associated with them will appear in the same mailbox. If you are the admin of a Professional or Visionary plan, you can manage email addresses for each user in your organization. The email address at the top of the list will automatically be selected as the default email address.`}</Alert>
            <AddressesToolbar
                members={members}
                onChangeMemberIndex={setMemberIndex}
                onAddAddress={handleAddAddress}
                memberIndex={memberIndex}
            />
            {selectedSelf ? (
                <AddressesWithUser user={user} />
            ) : (
                <Table className="pm-simple-table--has-actions">
                    <TableHeader
                        cells={[
                            c('Header for addresses table').t`Address`,
                            showUsername ? c('Header for addresses table').t`Username` : null,
                            c('Header for addresses table').t`Status`,
                            c('Header for addresses table').t`Actions`,
                        ].filter(Boolean)}
                    />
                    <TableBody
                        colSpan={showUsername ? 4 : 3}
                        loading={selectedMembers.some(({ ID }) => !Array.isArray(memberAddressesMap[ID]))}
                    >
                        {selectedMembers.flatMap((member) =>
                            (memberAddressesMap[member.ID] || []).map((address: Address, i: number) => (
                                <TableRow
                                    key={address.ID}
                                    cells={[
                                        address.Email,
                                        showUsername && member.Name,
                                        <AddressStatus key={1} {...getStatus(address, i)} />,
                                        <AddressActions
                                            key={2}
                                            member={member}
                                            address={address}
                                            user={user}
                                            organizationKey={loadingOrganizationKey ? undefined : organizationKey}
                                        />,
                                    ].filter(Boolean)}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            )}
        </>
    );
};

export default withRouter(AddressesWithMembers);
