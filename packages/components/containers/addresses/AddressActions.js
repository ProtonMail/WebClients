import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Dropdown, DropdownMenu, useApi } from 'react-components';
import { ADDRESS_TYPE, ADDRESS_STATUS, MEMBER_PRIVATE } from 'proton-shared/lib/constants';
import { createNotification } from 'proton-shared/lib/state/notifications/actions';
import { deleteAddress, enableAddress, disableAddress } from 'proton-shared/lib/api/addresses';

const { TYPE_ORIGINAL, TYPE_CUSTOM_DOMAIN, TYPE_PREMIUM } = ADDRESS_TYPE;
const { STATUS_DISABLED, STATUS_ENABLED } = ADDRESS_STATUS;
const { READABLE, UNREADABLE } = MEMBER_PRIVATE;

const AddressActions = ({ address, member, user, createNotification }) => {
    const { request: requestDelete } = useApi(() => deleteAddress(address.ID));
    const { request: requestEnable } = useApi(() => enableAddress(address.ID));
    const { request: requestDisable } = useApi(() => disableAddress(address.ID));
    const { Status, Type } = address;
    const canDelete = Type === TYPE_CUSTOM_DOMAIN;
    const canEnable =
        user.isAdmin && Status === STATUS_DISABLED && Type !== TYPE_ORIGINAL && address.Type !== TYPE_PREMIUM;
    const canDisable =
        user.isAdmin && Status === STATUS_ENABLED && Type !== TYPE_ORIGINAL && address.Type !== TYPE_PREMIUM;
    const canGenerate =
        ((user.isAdmin && member.Private === READABLE) || (member.Private === UNREADABLE && member.Self)) &&
        address.HasKeys === 0;

    const handleDelete = async () => {
        await requestDelete();
        // TODO call event manager
        createNotification({ text: c('Success notification').t`Address deleted` });
    };

    const handleEnable = async () => {
        await requestEnable();
        // TODO call event manager
        createNotification({ text: c('Success notification').t`Address enabled` });
    };

    const handleDisable = async () => {
        await requestDisable();
        // TODO call event manager
        createNotification({ text: c('Success notification').t`Address disabled` });
    };

    const handleGenerateMissingKeys = () => {};

    const list = [];

    if (canDelete) {
        list.push({
            text: c('Address action').t`Delete`,
            type: 'button',
            onClick: handleDelete
        });
    }

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
            onClick: handleGenerateMissingKeys
        });
    }

    return (
        <Dropdown className="pm-button pm-button--small" content={c('Action').t`Options`}>
            <DropdownMenu list={list} />
        </Dropdown>
    );
};

AddressActions.propTypes = {
    address: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
    member: PropTypes.object.isRequired,
    createNotification: PropTypes.func.isRequired
};

const mapStateToProps = ({ user: { data } }) => ({ user: data });
const mapDispatchToProps = { createNotification };

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(AddressActions);
