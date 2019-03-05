import React, { useEffect, useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Block, Label, Select, PrimaryButton, useModal } from 'react-components';
import { fetchMembers } from 'proton-shared/lib/state/members/actions';
import { connect } from 'react-redux';

import AddressModal from './AddressModal';

const AddressesToolbar = ({ onChangeMember, members, fetchMembers, loading }) => {
    const { isOpen, open, close } = useModal();
    const [member, setMember] = useState(members.data.find(({ Self }) => Self) || {});
    const options = members.data.map(({ ID: value, Name: text, Self: self }) => ({ text, value, self }));

    const handleChange = ({ target }) => {
        const { value, self } = target;

        setMember(members.data.find(({ ID }) => value === ID));
        onChangeMember(value, self);
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    return (
        <Block>
            <Label htmlFor="memberSelect" className="mr1">{c('Label').t`User:`}</Label>
            <Select
                disabled={loading}
                id="memberSelect"
                value={member.ID}
                options={options}
                className="mr1"
                onChange={handleChange}
            />
            <PrimaryButton disabled={loading} onClick={open}>{c('Action').t`Add address`}</PrimaryButton>
            <AddressModal show={isOpen} onClose={close} member={member} />
        </Block>
    );
};

AddressesToolbar.propTypes = {
    members: PropTypes.object,
    fetchMembers: PropTypes.func,
    onChangeMember: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired
};

const mapStateToProps = ({ members }) => ({ members });

const mapDispatchToProps = { fetchMembers };

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(AddressesToolbar);
