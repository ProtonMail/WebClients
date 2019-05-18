import React, { useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { updateAddress } from 'proton-shared/lib/api/addresses';
import {
    FormModal,
    Row,
    Field,
    Label,
    Input,
    RichTextEditor,
    useApi,
    useNotifications,
    useEventManager
} from 'react-components';

const EditAddressModal = ({ onClose, address, ...rest }) => {
    const { call } = useEventManager();
    const api = useApi();
    const [model, updateModel] = useState({ displayName: address.DisplayName, signature: address.Signature });
    const [loading, setLoading] = useState();
    const { createNotification } = useNotifications();

    const handleDisplayName = ({ target }) => updateModel({ ...model, displayName: target.value });

    const handleSignature = (value) => updateModel({ ...model, signature: value });

    const handleSubmit = async () => {
        try {
            setLoading(true);
            await api(updateAddress(address.ID, { DisplayName: model.displayName, Signature: model.signature }));
            await call();
            onClose();
            createNotification({ text: c('Success').t`Address updated` });
        } catch (e) {
            setLoading(false);
        }
    };

    return (
        <FormModal
            onClose={onClose}
            onSubmit={handleSubmit}
            title={c('Title').t`Edit address`}
            close={c('Action').t`Cancel`}
            submit={c('Action').t`Save`}
            small
            loading={loading}
            {...rest}
        >
            <Row>
                <Label>{c('Label').t`Address`}</Label>
                <Field>{address.Email}</Field>
            </Row>
            <Row>
                <Label>{c('Label').t`Display name`}</Label>
                <Field>
                    <Input
                        value={model.displayName}
                        placeholder={c('Placeholder').t`Choose display name`}
                        onChange={handleDisplayName}
                        required
                    />
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`Signature`}</Label>
                <Field>
                    <RichTextEditor value={model.signature} onChange={handleSignature} />
                </Field>
            </Row>
        </FormModal>
    );
};

EditAddressModal.propTypes = {
    address: PropTypes.object.isRequired,
    onClose: PropTypes.func
};

export default EditAddressModal;
