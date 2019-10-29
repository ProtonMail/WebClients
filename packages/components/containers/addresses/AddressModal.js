import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { createAddress } from 'proton-shared/lib/api/addresses';
import { ADDRESS_TYPE } from 'proton-shared/lib/constants';
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
    useApi,
    useAddresses,
    usePremiumDomains,
    useUser
} from 'react-components';

import useAddressModal from './useAddressModal';
import DomainsSelect from './DomainsSelect';
import CreateMissingKeysAddressModal from './CreateMissingKeysAddressModal';

const AddressModal = ({ onClose, member, organizationKey, ...rest }) => {
    const { createModal } = useModals();
    const { call } = useEventManager();
    const [user, loadingUser] = useUser();
    const [addresses, loadingAddresses] = useAddresses();
    const [premiumDomains, loadingPremiumDomains] = usePremiumDomains();
    const [premiumDomain = ''] = premiumDomains || [];
    const api = useApi();
    const { model, update } = useAddressModal(member);
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const hasPremium = addresses.some(({ Type }) => Type === ADDRESS_TYPE.TYPE_PREMIUM);
    const handleChange = (key) => ({ target }) => update(key, target.value);

    const handleSubmit = async () => {
        const { name: DisplayName, address: Local, domain: Domain } = model;

        if (!hasPremium && `${user.Name}@${premiumDomain}`.toLowerCase() === `${Local}@${Domain}`.toLowerCase()) {
            return createNotification({
                text: c('Error')
                    .t`${Local} is your username. To create ${Local}@${Domain}, please go to Settings > Identity > Short domain (pm.me)`,
                type: 'error'
            });
        }

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
            loading={loading || loadingAddresses || loadingPremiumDomains || loadingUser}
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
