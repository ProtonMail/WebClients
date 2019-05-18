import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { DropdownActions, useApi, useModals, useNotifications, useEventManager } from 'react-components';
import { ADDRESS_TYPE, ADDRESS_STATUS, MEMBER_PRIVATE } from 'proton-shared/lib/constants';
import { deleteAddress, enableAddress, disableAddress } from 'proton-shared/lib/api/addresses';

import EditAddressModal from './EditAddressModal';

const { TYPE_ORIGINAL, TYPE_CUSTOM_DOMAIN, TYPE_PREMIUM } = ADDRESS_TYPE;
const { STATUS_DISABLED, STATUS_ENABLED } = ADDRESS_STATUS;
const { READABLE, UNREADABLE } = MEMBER_PRIVATE;

const AddressActions = ({ address, user, fetchAddresses }) => {
    const { call } = useEventManager();
    const { Status, Type, ID } = address;
    const api = useApi();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();

    const canDelete = Type === TYPE_CUSTOM_DOMAIN;
    const canEnable = user.isAdmin && Status === STATUS_DISABLED && Type !== TYPE_ORIGINAL && Type !== TYPE_PREMIUM;
    const canDisable = user.isAdmin && Status === STATUS_ENABLED && Type !== TYPE_ORIGINAL && Type !== TYPE_PREMIUM;
    const canGenerate =
        ((user.isAdmin && address.member.Private === READABLE) ||
            (address.member.Private === UNREADABLE && address.member.Self)) &&
        !address.HasKeys;
    const fetchModel = address.member.Self ? call : fetchAddresses;

    const handleDelete = async () => {
        await api(deleteAddress(ID));
        await fetchModel();
        createNotification({ text: c('Success notification').t`Address deleted` });
    };

    const handleEnable = async () => {
        await api(enableAddress(ID));
        await fetchModel();
        createNotification({ text: c('Success notification').t`Address enabled` });
    };

    const handleDisable = async () => {
        await api(disableAddress(ID));
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
            onClick: () => createModal(<EditAddressModal address={address} />)
        },
        canEnable && {
            text: c('Address action').t`Enable`,
            onClick: handleEnable
        },
        canDisable && {
            text: c('Address action').t`Disable`,
            onClick: handleDisable
        },
        canGenerate && {
            text: c('Address action').t`Generate missing keys`,
            onClick: handleGenerate
        },
        canDelete && {
            text: c('Address action').t`Delete`,
            onClick: handleDelete
        }
    ].filter(Boolean);

    return <DropdownActions className="pm-button--small" list={list} />;
};

AddressActions.propTypes = {
    address: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
    fetchAddresses: PropTypes.func.isRequired
};

export default AddressActions;
