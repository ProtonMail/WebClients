import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';


import { Modal, ContentModal, FooterModal, ResetButton, PrimaryButton, Alert, Row, Label, Text, Input, RichTextEditor } from 'react-components';


import useAddressModal from './useAddressModal';
import DomainsSelect from './DomainsSelect';

const AddressModal = ({ show, onClose, member }) => {
    const { model, update } = useAddressModal(member);
    const title = c('Title').t`Create address`;

    const handleChange = (key) => (event) => update(key, event.target.value);
    const handleSignature = (value) => update('signature', value);

    const handleSubmit = async () => {
        const { name: DisplayName, signature: Signature, address: Local, domain: Domain } = model;
        const parameters = {
            MemberID: member.ID,
            Local, Domain,
            DisplayName, Signature
        };

        console.log(parameters);
    };

    return (
        <Modal show={show} onClose={onClose} title={title}>
            <ContentModal onSubmit={handleSubmit} onReset={onClose}>
                <Alert>
                    {c('Info').t`ProtonMail addresses can never be deleted (only disabled). ProtonMail addresses will always count towards your address limit whether enabled or not.`}
                    <br />
                    <LearnMore url="https://protonmail.com/support/knowledge-base/addresses-and-aliases/" />
                </Alert>
                <Row>
                    <Label>{c('Label').t`User`}</Label>
                    <Text className="strong">{member.Name}</Text>
                </Row>
                <Row>
                    <Label>{c('Label').t`Address`}</Label>
                    <div className="flex-autogrid">
                        <Input value={model.address} className="flex-autogrid-item" placeholder={c('Placeholder').t`Choose address`} onChange={handleChange('address')} />
                        <DomainsSelect member={member} onChange={handleChange('domain')} />
                    </div>
                </Row>
                <Row>
                    <Label>{c('Label').t`Display name`}</Label>
                    <Input value={model.name} placeholder={c('Placeholder').t`Choose display name`} onChange={handleChange('name')} />
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

AddressModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    member: PropTypes.object
};

export default AddressModal;