import React, { useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { updateAddress } from 'proton-shared/lib/api/addresses';
import {
    Modal,
    ContentModal,
    Row,
    Label,
    Text,
    Input,
    RichTextEditor,
    ResetButton,
    PrimaryButton,
    FooterModal,
    useApiWithoutResult,
    useNotifications
} from 'react-components';

const EditAddressModal = ({ show, onClose, address }) => {
    const { request } = useApiWithoutResult(updateAddress);
    const [model, updateModel] = useState({ displayName: address.DisplayName, signature: address.Signature });
    const { createNotification } = useNotifications();
    const handleDisplayName = (event) => updateModel({ ...model, displayName: event.target.value });
    const handleSignature = (value) => updateModel({ ...model, signature: value });
    const handleSubmit = async () => {
        await request(address.ID, { DisplayName: model.displayName, Signature: model.signature });
        // TODO call event manager
        onClose();
        createNotification({ text: c('Success').t`Address updated` });
    };
    return (
        <Modal show={show} onClose={onClose} title={c('Title').t`Edit address`}>
            <ContentModal onSubmit={handleSubmit} onReset={onClose}>
                <Row>
                    <Label>{c('Label').t`Address`}</Label>
                    <Text>{address.Email}</Text>
                </Row>
                <Row>
                    <Label>{c('Label').t`Display name`}</Label>
                    <Input
                        value={model.displayName}
                        placeholder={c('Placeholder').t`Choose display name`}
                        onChange={handleDisplayName}
                        required
                    />
                </Row>
                <Row>
                    <Label>{c('Label').t`Signature`}</Label>
                    <RichTextEditor value={model.signature} onChange={handleSignature} />
                </Row>
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
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
};

export default EditAddressModal;
