import React, { useEffect, useMemo, useState } from 'react';
import { ALL_MEMBERS_ID } from 'proton-shared/lib/constants';
import {
    useMembers,
    useOrganizationKey,
    useMemberAddresses,
    Loader,
    Table,
    TableHeader,
    TableBody,
    TableRow
} from 'react-components';
import { c } from 'ttag';
import PropTypes from 'prop-types';

import AddressesToolbar from './AddressesToolbar';
import AddressStatus from './AddressStatus';
import { getStatus } from './helper';
import AddressActions from './AddressActions';

const AddressesWithMembers = ({ user, organization }) => {
    const [members, loadingMembers] = useMembers();
    const [memberAddressesMap, loadingMemberAddresses] = useMemberAddresses(members);
    const [memberIndex, setMemberIndex] = useState(-1);
    const [organizationKey, loadingOrganizationKey] = useOrganizationKey(organization);

    useEffect(() => {
        if (memberIndex === -1 && Array.isArray(members)) {
            setMemberIndex(members.findIndex(({ Self }) => Self));
        }
    }, [members]);

    const selectedMembers = useMemo(() => {
        if (memberIndex === -1) {
            return [];
        }
        if (memberIndex === ALL_MEMBERS_ID) {
            return members;
        }
        return [members[memberIndex]];
    }, [members, memberIndex]);

    if (loadingMembers || memberIndex === -1 || (loadingMemberAddresses && !memberAddressesMap)) {
        return <Loader />;
    }

    const showUsername = memberIndex === ALL_MEMBERS_ID;

    return (
        <>
            <AddressesToolbar members={members} onChangeMemberIndex={setMemberIndex} memberIndex={memberIndex} />
            <Table>
                <TableHeader
                    cells={[
                        c('Header for addresses table').t`Address`,
                        showUsername ? c('Header for addresses table').t`Username` : null,
                        c('Header for addresses table').t`Status`,
                        c('Header for addresses table').t`Actions`
                    ].filter(Boolean)}
                />
                <TableBody
                    colSpan={showUsername ? 4 : 3}
                    loading={selectedMembers.some(({ ID }) => !Array.isArray(memberAddressesMap[ID]))}
                >
                    {selectedMembers
                        .map((member) => {
                            const addresses = memberAddressesMap[member.ID];

                            if (!Array.isArray(addresses)) {
                                return null;
                            }

                            return addresses.map((address, i) => {
                                return (
                                    <TableRow
                                        key={address.ID}
                                        cells={[
                                            address.Email,
                                            showUsername && member.Name,
                                            <AddressStatus key={1} {...getStatus({ address, i })} />,
                                            <AddressActions
                                                key={2}
                                                member={member}
                                                address={address}
                                                user={user}
                                                organizationKey={loadingOrganizationKey ? null : organizationKey}
                                            />
                                        ].filter(Boolean)}
                                    />
                                );
                            });
                        })
                        .flat()}
                </TableBody>
            </Table>
        </>
    );
};

AddressesWithMembers.propTypes = {
    user: PropTypes.object.isRequired,
    organization: PropTypes.object.isRequired
};

export default AddressesWithMembers;
