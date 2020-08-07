import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import {
    Alert,
    DropdownActions,
    ConfirmModal,
    useModals,
    useApiWithoutResult,
    useNotifications,
    useEventManager,
} from 'react-components';
import { deleteDomain } from 'proton-shared/lib/api/domains';

import DomainModal from './DomainModal';
import CatchAllModal from './CatchAllModal';

const DomainActions = ({ domain, domainAddresses }) => {
    const { request } = useApiWithoutResult(deleteDomain);
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const { call } = useEventManager();

    const handleConfirmDelete = async () => {
        await request(domain.ID);
        await call();
        createNotification({ text: c('Success message').t`Domain deleted` });
    };

    const list = [
        {
            text: c('Action').t`Edit`,
            onClick: () => createModal(<DomainModal domain={domain} domainAddresses={domainAddresses} />),
        },
        Array.isArray(domainAddresses) &&
            domainAddresses.length && {
                text: c('Action').t`Set catch-all`,
                onClick: () => createModal(<CatchAllModal domain={domain} domainAddresses={domainAddresses} />),
            },
        {
            text: c('Action').t`Delete`,
            actionType: 'delete',
            onClick: () => {
                createModal(
                    <ConfirmModal onConfirm={handleConfirmDelete} title={c('Title').t`Delete domain`}>
                        <Alert type="warning">{c('Info').t`Are you sure you want to delete this domain?`}</Alert>
                    </ConfirmModal>
                );
            },
        },
    ].filter(Boolean);

    return <DropdownActions className="pm-button--small" list={list} />;
};

DomainActions.propTypes = {
    domain: PropTypes.object.isRequired,
    domainAddresses: PropTypes.array,
};

export default DomainActions;
