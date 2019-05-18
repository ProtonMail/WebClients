import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import {
    Alert,
    DropdownActions,
    ConfirmModal,
    useModals,
    useApiWithoutResult,
    useNotifications
} from 'react-components';
import { deleteDomain } from 'proton-shared/lib/api/domains';

import DomainModal from './DomainModal';
import CatchAllModal from './CatchAllModal';

const DomainActions = ({ domain }) => {
    const { request } = useApiWithoutResult(deleteDomain);
    const { createNotification } = useNotifications();
    const { createModal } = useModals();

    const handleConfirmDelete = async () => {
        await request(domain.ID);
        // TODO: Show loader somewhere
        createNotification({ text: c('Success message').t`Domain deleted` });
    };

    const list = [
        {
            text: c('Action').t`Edit`,
            onClick: () => createModal(<DomainModal domain={domain} />)
        },
        {
            text: c('Action').t`Catch all`,
            onClick: () => createModal(<CatchAllModal domain={domain} />)
        },
        {
            text: c('Action').t`Delete`,
            onClick: () => {
                createModal(
                    <ConfirmModal onConfirm={handleConfirmDelete} title={c('Title').t`Delete domain`}>
                        <Alert>{c('Info').t`Are you sure you want to delete this domain?`}</Alert>
                    </ConfirmModal>
                );
            }
        }
    ];

    return <DropdownActions className="pm-button--small" list={list} />;
};

DomainActions.propTypes = {
    domain: PropTypes.object.isRequired
};

export default DomainActions;
