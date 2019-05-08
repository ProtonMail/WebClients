import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { DropdownActions, useApiWithoutResult, useModal, useNotifications, useEventManager } from 'react-components';
import { ADDRESS_TYPE, ADDRESS_STATUS, MEMBER_PRIVATE } from 'proton-shared/lib/constants';
import { deleteAddress, enableAddress, disableAddress } from 'proton-shared/lib/api/addresses';

import EditAddressModal from './EditAddressModal';

const { TYPE_ORIGINAL, TYPE_CUSTOM_DOMAIN, TYPE_PREMIUM } = ADDRESS_TYPE;
const { STATUS_DISABLED, STATUS_ENABLED } = ADDRESS_STATUS;
const { READABLE, UNREADABLE } = MEMBER_PRIVATE;

const AddressActions = ({ address, user, fetchAddresses }) => {
    const { call } = useEventManager();
    const { Status, Type, ID } = address;
    const { request: requestDelete } = useApiWithoutResult(deleteAddress);
    const { request: requestEnable } = useApiWithoutResult(enableAddress);
    const { request: requestDisable } = useApiWithoutResult(disableAddress);
    const { isOpen, open, close } = useModal();
    const { createNotification } = useNotifications();
    const canDelete = Type === TYPE_CUSTOM_DOMAIN;
    const canEnable = user.isAdmin && Status === STATUS_DISABLED && Type !== TYPE_ORIGINAL && Type !== TYPE_PREMIUM;
    const canDisable = user.isAdmin && Status === STATUS_ENABLED && Type !== TYPE_ORIGINAL && Type !== TYPE_PREMIUM;
    const canGenerate =
        ((user.isAdmin && address.member.Private === READABLE) ||
            (address.member.Private === UNREADABLE && address.member.Self)) &&
        !address.HasKeys;
    const fetchModel = address.member.Self ? call : fetchAddresses;

    const handleDelete = async () => {
        await requestDelete(ID);
        await fetchModel();
        createNotification({ text: c('Success notification').t`Address deleted` });
    };

    const handleEnable = async () => {
        await requestEnable(ID);
        await fetchModel();
        createNotification({ text: c('Success notification').t`Address enabled` });
    };

    const handleDisable = async () => {
        await requestDisable(ID);
        await fetchModel();
        createNotification({ text: c('Success notification').t`Address disabled` });
    };

    const handleGenerate = async () => {
        // TODO generate missing keys
        await fetchModel();
        createNotification({ text: c('Success notification').t`Keys generated` });
    };

    const list = [
        {
            text: c('Address action').t`Edit`,
            type: 'button',
            onClick: open
        }
    ];

    if (canEnable) {
        list.push({
            text: c('Address action').t`Enable`,
            type: 'button',
            onClick: handleEnable
        });
    }

    if (canDisable) {
        list.push({
            text: c('Address action').t`Disable`,
            type: 'button',
            onClick: handleDisable
        });
    }

    if (canGenerate) {
        list.push({
            text: c('Address action').t`Generate missing keys`,
            type: 'button',
            onClick: handleGenerate
        });
    }

    if (canDelete) {
        list.push({
            text: c('Address action').t`Delete`,
            type: 'button',
            onClick: handleDelete
        });
    }

    return (
        <>
            <DropdownActions list={list} className="pm-button--small" />
            {isOpen ? <EditAddressModal onClose={close} address={address} /> : null}
        </>
    );
};

AddressActions.propTypes = {
    address: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
    fetchAddresses: PropTypes.func.isRequired
};

export default AddressActions;
