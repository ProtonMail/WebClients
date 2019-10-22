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
    useLoading,
    useNotifications,
    useEventManager,
    useModals,
    useApi
} from 'react-components';

import useAddressModal from './useAddressModal';
import DomainsSelect from './DomainsSelect';
import CreateMissingKeysAddressModal from './CreateMissingKeysAddressModal';

const AddressModal = ({ onClose, member, organizationKey, ...rest }) => {
    const { createModal } = useModals();
    const { call } = useEventManager();
    const api = useApi();
    const { model, update } = useAddressModal(member);
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const handleChange = (key) => ({ target }) => update(key, target.value);

    const handleSubmit = async () => {
        const { name: DisplayName, address: Local, domain: Domain } = model;

        const { Address } = await api(
            createAddress({
                MemberID: member.ID,
                Local,
                Domain,
                DisplayName
            })
        );
        await call();

        onClose();
        createNotification({ text: c('Success').t`Address added` });

        createModal(
            <CreateMissingKeysAddressModal organizationKey={organizationKey} member={member} addresses={[Address]} />
        );
    };

    return (
        <FormModal
            title={c('Title').t`Create address`}
            submit={c('Action').t`Save`}
            cancel={c('Action').t`Cancel`}
            loading={loading}
            onSubmit={() => withLoading(handleSubmit())}
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
                <Field>
                    <div className="flex-autogrid">
                        <div className="flex-autogrid-item pb0">
                            <Input
                                value={model.address}
                                placeholder={c('Placeholder').t`Choose address`}
                                onChange={handleChange('address')}
                                required
                            />
                        </div>
                        <div className="flex-autogrid-item pb0">
                            <DomainsSelect member={member} onChange={handleChange('domain')} />
                        </div>
                    </div>
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
        </FormModal>
    );
};

AddressModal.propTypes = {
    onClose: PropTypes.func,
    member: PropTypes.object,
    organizationKey: PropTypes.object
};

export default AddressModal;
