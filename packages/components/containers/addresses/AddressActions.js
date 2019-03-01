import React from 'react';
import { c } from 'ttag';
import { Dropdown, DropdownMenu } from 'react-components';

const AddressActions = () => {
    const list = [];

    return (
        <Dropdown className="pm-button pm-button--small" content={c('Action').t`Options`}>
            <DropdownMenu list={list} />
        </Dropdown>
    );
};

export default AddressActions;
