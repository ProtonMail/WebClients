import React, { useEffect, useState } from 'react';
import { c } from 'ttag';
import { PrimaryButton, useModal, useNotifications, useDomains, useOrganization } from 'react-components';
import { DOMAIN_STATE } from 'proton-shared/lib/constants';

import MemberModal from './MemberModal';

const { DOMAIN_STATE_ACTIVE } = DOMAIN_STATE;

const AddMemberButton = () => {
    const [organization] = useOrganization();
    const [domains = [], domainsLoading] = useDomains();

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
        setDomains(domains.filter(({ State }) => State === DOMAIN_STATE_ACTIVE));
    }, [domains]);

    return (
        <>
            <PrimaryButton disabled={domainsLoading} onClick={handleClick}>{c('Action').t`Add user`}</PrimaryButton>
            {domainsLoading ? null : (
                <MemberModal show={isOpen} onClose={close} organization={organization} domains={verifiedDomains} />
            )}
        </>
    );
};

AddMemberButton.propTypes = {};

export default AddMemberButton;
