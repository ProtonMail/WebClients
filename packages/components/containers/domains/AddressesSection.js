import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import {
    useMembers,
    Alert,
    Button,
    PrimaryButton,
    Block,
    Table,
    TableHeader,
    TableBody,
    TableRow
} from 'react-components';

const AddressesSection = ({ domainAddresses, onRedirect }) => {
    const [members, loadingMembers] = useMembers();

    const getMemberName = (memberID) => {
        const { Name = '' } = members.find(({ ID }) => ID === memberID);
        return Name;
    };

    return (
        <>
            <Alert>{c('Info for domain modal')
                .t`Please add addresses to send and receive email with this domain.`}</Alert>
            <Block>
                <PrimaryButton className="mr1" onClick={() => onRedirect('/settings/addresses')}>{c('Action')
                    .t`Add address`}</PrimaryButton>
                <Button onClick={() => onRedirect('/settings/members')}>{c('Action').t`Add user`}</Button>
            </Block>
            {domainAddresses.length ? (
                <Table>
                    <TableHeader
                        cells={[c('Header for domain modal').t`User`, c('Header for domain modal').t`Address`]}
                    />
                    <TableBody loading={loadingMembers} colSpan={2}>
                        {members &&
                            domainAddresses.map(({ ID, Email, MemberID }) => {
                                return <TableRow key={ID} cells={[getMemberName(MemberID), Email]} />;
                            })}
                    </TableBody>
                </Table>
            ) : null}
        </>
    );
};

AddressesSection.propTypes = {
    domainAddresses: PropTypes.array.isRequired,
    onRedirect: PropTypes.func.isRequired
};

export default AddressesSection;
