import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { createAddress } from 'proton-shared/lib/api/addresses';
import {
    FormModal,
    Alert,
    Row,
    Field,
    Label,
    Input,
    RichTextEditor,
    useApiWithoutResult,
    useNotifications,
    useEventManager
} from 'react-components';

import useAddressModal from './useAddressModal';
import DomainsSelect from './DomainsSelect';

const AddressModal = ({ onClose, member, ...rest }) => {
    const { call } = useEventManager();
    const { request } = useApiWithoutResult(createAddress);
    const { model, update } = useAddressModal(member);
    const { createNotification } = useNotifications();

    const handleChange = (key) => ({ target }) => update(key, target.value);
    const handleSignature = (value) => update('signature', value);

    const handleSubmit = async () => {
        const { name: DisplayName, signature: Signature, address: Local, domain: Domain } = model;
        const parameters = {
            MemberID: member.ID,
            Local,
            Domain,
            DisplayName,
            Signature
        };

        await request(parameters);
        await call();
        onClose();
        createNotification({ text: c('Success').t`Address added` });
    };

    return (
        <FormModal
            title={c('Title').t`Create address`}
            submit={c('Action').t`Save`}
            cancel={c('Action').t`Cancel`}
            onSubmit={handleSubmit}
            onClose={onClose}
            {...rest}
        >
            <Alert learnMore="https://protonmail.com/support/knowledge-base/addresses-and-aliases/">
                {c('Info')
                    .t`ProtonMail addresses can never be deleted (only disabled). ProtonMail addresses will always count towards your address limit whether enabled or not.`}
            </Alert>
            <Row>
                <Label>{c('Label').t`User`}</Label>
                <Field className="strong">{member.Name}</Field>
            </Row>
            <Row>
                <Label>{c('Label').t`Address`}</Label>
                <Field className="flex-autogrid">
                    <Input
                        value={model.address}
                        className="flex-autogrid-item"
                        placeholder={c('Placeholder').t`Choose address`}
                        onChange={handleChange('address')}
                        required
                    />
                    <DomainsSelect className="flex-autogrid-item" member={member} onChange={handleChange('domain')} />
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`Display name`}</Label>
                <Field>
                    <Input
                        value={model.name}
                        placeholder={c('Placeholder').t`Choose display name`}
                        onChange={handleChange('name')}
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

AddressModal.propTypes = {
    onClose: PropTypes.func,
    member: PropTypes.object
};

export default AddressModal;
