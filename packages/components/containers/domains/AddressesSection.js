import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Alert, Button, PrimaryButton, Block, Table, TableHeader, TableBody, TableRow } from 'react-components';

const AddressesSection = ({ domain, members, history }) => {
    const handleAddAddress = () => history.push('/addresses');
    const handleAddUser = () => history.push('/members');
    const getMemberName = (memberID) => {
        const { Name = '' } = members.data.find(({ ID }) => ID === memberID);
        return Name;
    };

    return (
        <>
            <Alert>{c('Info for domain modal')
                .t`Please add addresses to send and receive email with this domain.`}</Alert>
            <Block>
                <PrimaryButton onClick={handleAddAddress}>{c('Action').t`Add address`}</PrimaryButton>
                <Button onClick={handleAddUser}>{c('Action').t`Add user`}</Button>
            </Block>
            {domain.addresses.length ? (
                <Table>
                    <TableHeader
                        cells={[c('Header for domain modal').t`User`, c('Header for domain modal').t`Address`]}
                    />
                    <TableBody>
                        {domain.addresses.map(({ ID, Email, MemberID }) => {
                            return <TableRow key={ID} cells={[getMemberName(MemberID), Email]} />;
                        })}
                    </TableBody>
                </Table>
            ) : null}
        </>
    );
};

AddressesSection.propTypes = {
    domain: PropTypes.object.isRequired,
    members: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
};

const mapStateToProps = ({ members }) => ({ members });

export default withRouter(connect(mapStateToProps)(AddressesSection));
