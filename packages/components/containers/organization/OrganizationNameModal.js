import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { updateOrganizationName } from 'proton-shared/lib/api/organization';
import { InputModal, useEventManager, useApi, useLoading } from 'react-components';

const OrganizationNameModal = ({ onClose, organizationName, ...rest }) => {
    const api = useApi();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();

    const handleSubmit = async (name) => {
        await api(updateOrganizationName(name));
        await call();
        onClose();
    };

    return (
        <InputModal
            input={organizationName}
            loading={loading}
            title={c('Title').t`Change organization name`}
            label={c('Label').t`Organization name`}
            placeholder={c('Placeholder').t`Choose a name`}
            onSubmit={(name) => withLoading(handleSubmit(name))}
            onClose={onClose}
            {...rest}
        />
    );
};

OrganizationNameModal.propTypes = {
    organizationName: PropTypes.string.isRequired,
    onClose: PropTypes.func
};

export default OrganizationNameModal;
