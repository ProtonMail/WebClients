import React from 'react';
import { c } from 'ttag';
import { SubTitle, Block, Label, Table, PrimaryButton, Select, TableHeader, useModal, TableBody } from 'react-components';

import AddressModal from './AddressModal';
import AddressActions from './AddressActions';
import AddressStatus from './AddressStatus';

const AddressesSection = () => {
    const users = []; // TODO
    const addresses = []; // TODO
    const { isOpen: showAddressModal, open: openAddressModal, closeAddressModal } = useModal();
    const handleChangeUser = () => {};

    return (
        <>
            <SubTitle>{c('Title').t`Addresses`}</SubTitle>
            <Block>
                <Label htmlFor="userSelect">{c('Label'.t`User:`)}</Label>
                <Select id="userSelect" options={users} onChange={handleChangeUser} />
                <PrimaryButton onClick={openAddressModal}>{c('Action').t`Add address`}</PrimaryButton>
                <AddressModal show={showAddressModal} onClose={closeAddressModal} />
            </Block>
            <Table>
                <TableHeader cells={[
                    c('Header for addresses table').t`Address`,
                    c('Header for addresses table').t`Status`,
                    c('Header for addresses table').t`Actions`
                ]} />
                <TableBody>
                    {addresses.map((address) => {
                        const key = address.ID;
                        return <TableRow key={key} cells={[
                            address.Email,
                            <AddressStatus key={key} address={address} />,
                            <AddressActions key={key} address={address} />
                        ]} />;
                    })}
                </TableBody>
            </Table>
        </>
    );
};

export default AddressesSection;