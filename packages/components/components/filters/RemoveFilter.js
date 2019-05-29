import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    Button,
    ConfirmModal,
    Alert,
    useApiWithoutResult,
    useModals,
    useNotifications,
    useEventManager
} from 'react-components';
import { deleteFilter } from 'proton-shared/lib/api/filters';
import { noop } from 'proton-shared/lib/helpers/function';

function RemoveFilter({ filter, className, onRemoveFilter }) {
    const { call } = useEventManager();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const { request, loading } = useApiWithoutResult(deleteFilter);

    const handleConfirmConfirmModal = async () => {
        await request(filter.ID);
        await call();
        createNotification({
            text: c('Filter notification').t`Filter removed`
        });
        onRemoveFilter(filter);
    };

    const handleClick = () =>
        createModal(
            <ConfirmModal onConfirm={handleConfirmConfirmModal} title={c('Title').t`Delete Filter`}>
                <Alert>{c('Info').t`Are you sure you want to delete this filter?`}</Alert>
            </ConfirmModal>
        );

    return (
        <Button className={className} onClick={handleClick} loading={loading}>
            {c('Action').t`Delete`}
        </Button>
    );
}

RemoveFilter.propTypes = {
    filter: PropTypes.object.isRequired,
    className: PropTypes.string,
    onRemoveFilter: PropTypes.func
};

RemoveFilter.defaultProps = {
    onRemoveFilter: noop
};

export default RemoveFilter;
