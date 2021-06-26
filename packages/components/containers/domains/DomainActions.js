import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { deleteDomain } from 'proton-shared/lib/api/domains';
import { Alert, DropdownActions, ConfirmModal, ErrorButton } from '../../components';
import { useModals, useApiWithoutResult, useNotifications, useEventManager } from '../../hooks';

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
            text: c('Action').t`Review`,
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
                    <ConfirmModal
                        title={c('Title').t`Delete ${domain.DomainName}`}
                        onConfirm={handleConfirmDelete}
                        confirm={<ErrorButton type="submit">{c('Action').t`Delete`}</ErrorButton>}
                    >
                        <Alert type="info">{c('Info')
                            .t`Please note that if you delete this domain, all the addresses associated with it will be disabled.`}</Alert>
                        <Alert type="error">{c('Info').t`Are you sure you want to delete this domain?`}</Alert>
                    </ConfirmModal>
                );
            },
        },
    ].filter(Boolean);

    return <DropdownActions size="small" list={list} />;
};

DomainActions.propTypes = {
    domain: PropTypes.object.isRequired,
    domainAddresses: PropTypes.array,
};

export default DomainActions;
