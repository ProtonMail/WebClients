import React from 'react';
import { c } from 'ttag';
import { updateOrganizationName } from 'proton-shared/lib/api/organization';
import { InputModal, useEventManager, useApi, useLoading } from '../../index';

interface Props {
    onClose?: () => void;
    organizationName: string;
}
const OrganizationNameModal = ({ onClose, organizationName, ...rest }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();

    const handleSubmit = async (name: string) => {
        await api(updateOrganizationName(name));
        await call();
        onClose?.();
    };

    return (
        <InputModal
            input={organizationName}
            loading={loading}
            title={c('Title').t`Change organization name`}
            label={c('Label').t`Organization name`}
            placeholder={c('Placeholder').t`Choose a name`}
            onSubmit={(name: string) => withLoading(handleSubmit(name))}
            onClose={onClose}
            {...rest}
        />
    );
};

export default OrganizationNameModal;
