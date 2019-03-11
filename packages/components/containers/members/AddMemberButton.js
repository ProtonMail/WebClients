import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { connect } from 'react-redux';
import { PrimaryButton, useModal, useNotifications } from 'react-components';
import { fetchDomains } from 'proton-shared/lib/state/domains/actions';
import { DOMAIN_STATE } from 'proton-shared/lib/constants';

import MemberModal from './MemberModal';

const { DOMAIN_STATE_ACTIVE } = DOMAIN_STATE;

const AddMemberButton = ({ organization, domains, fetchDomains }) => {
    const { createNotification } = useNotifications();
    const [verifiedDomains, setDomains] = useState([]);
    const { isOpen, open, close } = useModal();
    const handleClick = () => {
        try {
            if (organization.MaxMembers === 1) {
                throw new Error(c('Error').t`Multi-user support requires either a Professional or Visionary plan.`);
            }

            if (!organization.HasKeys) {
                throw new Error(
                    c('Error').t`Please enable multi-user support before adding users to your organization.`
                );
                // TODO redirect to activate multi-user support
            }

            if (!verifiedDomains.length) {
                throw new Error(
                    c('Error').t`Please configure a custom domain before adding users to your organization.`
                );
            }

            if (organization.MaxMembers - organization.UsedMembers < 1) {
                throw new Error(
                    c('Error').t`You have used all users in your plan. Please upgrade your plan to add a new user.`
                );
            }

            if (organization.MaxAddresses - organization.UsedAddresses < 1) {
                throw new Error(
                    c('Error')
                        .t`You have used all addresses in your plan. Please upgrade your plan to add a new address.`
                );
            }

            if (organization.MaxSpace - organization.AssignedSpace < 1) {
                throw new Error(
                    c('Error').t`All storage space has been allocated. Please reduce storage allocated to other users.`
                );
            }

            // TODO check organization key status
            // if (keyStatus > 0) {
            //     throw new Error(c('Error').t``);
            // }
        } catch (error) {
            createNotification({ type: 'error', text: error.message });
            throw error;
        }

        open();
    };

    useEffect(() => {
        fetchDomains();
    }, []);

    useEffect(() => {
        setDomains(domains.data.filter(({ State }) => State === DOMAIN_STATE_ACTIVE));
    }, [domains.data]);

    return (
        <>
            <PrimaryButton disabled={domains.loading} onClick={handleClick}>{c('Action').t`Add user`}</PrimaryButton>
            {domains.loading ? null : (
                <MemberModal show={isOpen} onClose={close} organization={organization} domains={verifiedDomains} />
            )}
        </>
    );
};

AddMemberButton.propTypes = {
    organization: PropTypes.object.isRequired,
    domains: PropTypes.object.isRequired,
    fetchDomains: PropTypes.func.isRequired
};

const mapStateToProps = ({ organization: { data: dataOrganization }, domains }) => ({
    organization: dataOrganization,
    domains
});
const mapDispatchToProps = { fetchDomains };

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(AddMemberButton);
