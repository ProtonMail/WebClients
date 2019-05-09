import React, { useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { updateAddress } from 'proton-shared/lib/api/addresses';
import {
    Modal,
    ContentModal,
    InnerModal,
    Row,
    Field,
    Label,
    Input,
    RichTextEditor,
    ResetButton,
    PrimaryButton,
    FooterModal,
    useApiWithoutResult,
    useNotifications,
    useEventManager
} from 'react-components';

const EditAddressModal = ({ onClose, address }) => {
    const { call } = useEventManager();
    const { request } = useApiWithoutResult(updateAddress);
    const [model, updateModel] = useState({ displayName: address.DisplayName, signature: address.Signature });
    const { createNotification } = useNotifications();
    const handleDisplayName = ({ target }) => updateModel({ ...model, displayName: target.value });
    const handleSignature = (value) => updateModel({ ...model, signature: value });
    const handleSubmit = async () => {
        await request(address.ID, { DisplayName: model.displayName, Signature: model.signature });
        await call();
        onClose();
        createNotification({ text: c('Success').t`Address updated` });
    };
    return (
        <Modal onClose={onClose} title={c('Title').t`Edit address`} type="small">
            <ContentModal onSubmit={handleSubmit} onReset={onClose}>
                <InnerModal>
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
                </InnerModal>
                <FooterModal>
                    <ResetButton>{c('Action').t`Cancel`}</ResetButton>
                    <PrimaryButton type="submit">{c('Action').t`Save`}</PrimaryButton>
                </FooterModal>
            </ContentModal>
        </Modal>
    );
};

EditAddressModal.propTypes = {
    address: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired
};

export default EditAddressModal;
